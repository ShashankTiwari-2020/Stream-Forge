import json
import logging
from typing import Any

from confluent_kafka import Producer


logger = logging.getLogger(__name__)


class HighThroughputTemperatureProducer:
    """Asynchronous, batched Kafka producer for truck telemetry."""

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "temperature-events",
    ):
        self.topic = topic
        self.delivered_count = 0
        self.failed_count = 0

        config = {
            "bootstrap.servers": bootstrap_servers,
            "client.id": "streamforge-high-throughput-producer",
            "acks": "all",
            "enable.idempotence": True,
            "compression.type": "gzip",
            "linger.ms": 10,
            "batch.size": 65536,
            "queue.buffering.max.messages": 100000,
        }

        self.producer = Producer(config)

    def _delivery_callback(self, error, message):
        if error is not None:
            self.failed_count += 1
            logger.error("Kafka delivery failed: %s", error)
            return

        self.delivered_count += 1

    def send_event(self, event: dict[str, Any]) -> None:
        required_fields = {
            "event_id",
            "truck_id",
            "temperature",
            "timestamp",
        }

        missing = required_fields.difference(event)

        if missing:
            raise ValueError(
                f"Missing event fields: {sorted(missing)}"
            )

        payload = json.dumps(event).encode("utf-8")
        key = event["truck_id"].encode("utf-8")

        while True:
            try:
                self.producer.produce(
                    topic=self.topic,
                    key=key,
                    value=payload,
                    on_delivery=self._delivery_callback,
                )
                self.producer.poll(0)
                break

            except BufferError:
                logger.warning("Kafka queue full; waiting for capacity")
                self.producer.poll(1)

    def send_events(self, events: list[dict[str, Any]]) -> None:
        for event in events:
            self.send_event(event)

    def flush(self, timeout: float = 30) -> int:
        return self.producer.flush(timeout)

    def close(self) -> None:
        remaining = self.flush()

        if remaining:
            logger.warning(
                "%s messages were not delivered before timeout",
                remaining,
            )

    def get_stats(self) -> dict[str, int]:
        return {
            "delivered": self.delivered_count,
            "failed": self.failed_count,
        }
