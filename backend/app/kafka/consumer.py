
import json
import logging

from kafka import KafkaConsumer
from kafka.structs import OffsetAndMetadata, TopicPartition

from backend.app.schemas.events import TemperatureEvent
from backend.app.storage.repository import EventRepository


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TemperatureConsumer:
    """Consume Kafka events and persist them in SQLite."""

    def __init__(self, bootstrap_servers="localhost:9092"):
        self.repository = EventRepository()

        self.consumer = KafkaConsumer(
            "temperature-events",
            bootstrap_servers=bootstrap_servers,
            group_id="streamforge-temperature-consumers",
            auto_offset_reset="earliest",
            enable_auto_commit=False,
            key_deserializer=lambda key: (
                key.decode("utf-8") if key else None
            ),
            value_deserializer=lambda value: json.loads(
                value.decode("utf-8")
            ),
        )

    def start(self):
        logger.info("Listening for temperature events...")

        try:
            for message in self.consumer:
                try:
                    event = TemperatureEvent.model_validate(
                        message.value
                    )

                    accepted = self.repository.add_event(event)

                    # Commit only after successful persistence
                    # or confirmation that the event is a duplicate.
                    self.consumer.commit(
    offsets={
        TopicPartition(message.topic, message.partition):
        OffsetAndMetadata(message.offset + 1, "")
    }
)

                    if accepted:
                        logger.info(
                            "Event stored: truck=%s temperature=%s "
                            "partition=%s offset=%s",
                            event.truck_id,
                            event.temperature,
                            message.partition,
                            message.offset,
                        )
                    else:
                        logger.info(
                            "Duplicate event ignored: %s",
                            event.event_id,
                        )

                except Exception:
                    logger.exception(
                        "Failed to process Kafka message at "
                        "partition=%s offset=%s",
                        message.partition,
                        message.offset,
                    )
                    # Stop processing so this message is not
                    # silently skipped by a later offset commit.
                    raise

        except KeyboardInterrupt:
            logger.info("Consumer stopped.")

        finally:
            self.consumer.close()


if __name__ == "__main__":
    consumer = TemperatureConsumer()
    consumer.start()
