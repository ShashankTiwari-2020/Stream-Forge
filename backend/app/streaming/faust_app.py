import logging

import faust
from pydantic import ValidationError

from backend.app.streaming.transforms import transform_temperature_event


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("streamforge.faust")

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

        await processed_topic.send(
            key=transformed["truck_id"],
            value=transformed,
        )

        logger.info(
            "Processed event=%s truck=%s temperature=%s",
            transformed["event_id"],
            transformed["truck_id"],
            transformed["temperature"],
        )


if __name__ == "__main__":
    app.main()
