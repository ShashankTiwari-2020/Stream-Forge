import logging

import faust
from pydantic import ValidationError

from backend.app.streaming.transforms import transform_temperature_event
from backend.app.streaming.event_time_windows import EventTimeWindowAggregator


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("streamforge.faust")

# Five-minute event-time aggregation with one-minute allowed lateness
window_aggregator = EventTimeWindowAggregator(
    window_minutes=5,
    allowed_lateness_minutes=1,
)

app = faust.App(
    "streamforge-week2-processor",
    broker="kafka://localhost:9092",
    key_serializer="raw",
    value_serializer="json",
    consumer_auto_offset_reset="latest",
)

# Existing input topic
temperature_topic = app.topic(
    "temperature-events",
    key_type=str,
    value_serializer="json",
)

# New output topics
processed_topic = app.topic(
    "temperature-events-processed",
    key_type=str,
    value_serializer="json",
)

dead_letter_topic = app.topic(
    "temperature-events-dead-letter",
    value_serializer="json",
)


# Five-minute finalized window results
window_topic = app.topic(
    "temperature-windows-5m",
    key_type=str,
    value_serializer="json",
)

# Events rejected because they arrived too late
late_events_topic = app.topic(
    "temperature-events-late",
    key_type=str,
    value_serializer="json",
)

@app.agent(temperature_topic)
async def process_temperature_events(events):
    async for payload in events:
        try:
            transformed = transform_temperature_event(payload)

        except ValidationError as exc:
            logger.warning("Invalid temperature event: %s", exc)

            await dead_letter_topic.send(
                value={
                    "payload": payload,
                    "error": str(exc),
                }
            )
            continue

        except Exception:
            logger.exception("Unexpected event processing failure")
            raise

        if transformed is None:
            logger.info(
                "Filtered event with non-positive temperature: %s",
                payload.get("event_id"),
            )
            continue

        # Preserve the existing processed-event output.
        await processed_topic.send(
            key=transformed["truck_id"],
            value=transformed,
        )

        # Process the event using its event timestamp.
        result = window_aggregator.process(transformed)

        if result["status"] == "late":
            await late_events_topic.send(
                key=transformed["truck_id"],
                value=result,
            )

            logger.warning(
                "Late event=%s truck=%s watermark=%s",
                transformed["event_id"],
                transformed["truck_id"],
                result["watermark"],
            )
            continue

        if result["status"] == "duplicate":
            logger.info(
                "Duplicate event ignored: %s",
                transformed["event_id"],
            )
            continue

        # Publish every finalized five-minute window.
        for window_result in result["finalized_windows"]:
            await window_topic.send(
                key=window_result["truck_id"],
                value=window_result,
            )

            logger.info(
                "Finalized window truck=%s start=%s average=%s count=%s",
                window_result["truck_id"],
                window_result["window_start"],
                window_result["average_temperature"],
                window_result["reading_count"],
            )

        logger.info(
            "Processed event=%s truck=%s temperature=%s",
            transformed["event_id"],
            transformed["truck_id"],
            transformed["temperature"],
        )


if __name__ == "__main__":
    app.main()
