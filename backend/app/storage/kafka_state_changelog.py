import hashlib
import hmac
import json
import threading
import time
import uuid
from typing import Any

from confluent_kafka import Consumer, KafkaError, Producer, TopicPartition


class KafkaStateChangelog:
    

    SCHEMA_VERSION = 1
    PARTITION = 0
    MESSAGE_KEY = b"streamforge-state-snapshot"

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "streamforge-state-changelog",
        timeout: float = 30.0,
    ) -> None:
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.timeout = timeout
        self._lock = threading.Lock()
        self._producer = Producer({
            "bootstrap.servers": bootstrap_servers,
            "client.id": "streamforge-state-changelog",
            "acks": "all",
            "enable.idempotence": True,
            "retries": 10,
            "max.in.flight.requests.per.connection": 5,
        })

    @staticmethod
    def _canonical_json(value: dict[str, Any]) -> bytes:
        return json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")

    @classmethod
    def _build_envelope(
        cls,
        sequence: int,
        snapshot_id: str,
        records: dict[str, Any],
    ) -> dict[str, Any]:
        if not isinstance(records, dict):
            raise TypeError("Snapshot records must be a dictionary")

        body = {
            "schema_version": cls.SCHEMA_VERSION,
            "sequence": sequence,
            "snapshot_id": snapshot_id,
            "state": records,
        }

        checksum = hashlib.sha256(cls._canonical_json(body)).hexdigest()
        return {**body, "checksum": checksum}

    @classmethod
    def _validate_envelope(cls, envelope: Any) -> dict[str, Any]:
        if not isinstance(envelope, dict):
            raise ValueError("Snapshot must be a JSON object")

        required = {
            "schema_version", "sequence", "snapshot_id", "state", "checksum"
        }
        if not required.issubset(envelope):
            raise ValueError("Snapshot is missing required fields")

        if envelope["schema_version"] != cls.SCHEMA_VERSION:
            raise ValueError("Unsupported snapshot schema version")

        if not type(envelope["sequence"]) is int or envelope["sequence"] < 1:
            raise ValueError("Invalid snapshot sequence")

        if not isinstance(envelope["snapshot_id"], str) or not envelope["snapshot_id"]:
            raise ValueError("Invalid snapshot ID")

        if not isinstance(envelope["state"], dict):
            raise ValueError("Snapshot state must be a dictionary")

        body = {
            "schema_version": envelope["schema_version"],
            "sequence": envelope["sequence"],
            "snapshot_id": envelope["snapshot_id"],
            "state": envelope["state"],
        }

        expected = hashlib.sha256(cls._canonical_json(body)).hexdigest()
        if not isinstance(envelope["checksum"], str):
            raise ValueError("Invalid snapshot checksum")

        if not hmac.compare_digest(expected, envelope["checksum"]):
            raise ValueError("Snapshot checksum mismatch")

        return envelope

    def _read_latest_envelope(self) -> dict[str, Any] | None:
        consumer = Consumer({
            "bootstrap.servers": self.bootstrap_servers,
            "group.id": f"streamforge-changelog-recovery-{uuid.uuid4()}",
            "enable.auto.commit": False,
            "auto.offset.reset": "earliest",
            "isolation.level": "read_uncommitted",
        })

        try:
            partition = TopicPartition(self.topic, self.PARTITION)
            low, high = consumer.get_watermark_offsets(
                partition, timeout=10.0, cached=False
            )

            if high <= low:
                return None

            consumer.assign([TopicPartition(self.topic, self.PARTITION, low)])

            latest = None
            next_offset = low
            deadline = time.monotonic() + self.timeout

            while next_offset < high:
                if time.monotonic() >= deadline:
                    raise TimeoutError("Timed out reading the Kafka changelog")

                message = consumer.poll(1.0)

                if message is None:
                    continue

                if message.error():
                    if message.error().code() == KafkaError._PARTITION_EOF:
                        break
                    raise RuntimeError(
                        f"Changelog read failed: {message.error()}"
                    )

                next_offset = message.offset() + 1

                try:
                    envelope = json.loads(message.value().decode("utf-8"))
                    self._validate_envelope(envelope)
                except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
                    raise ValueError(
                        f"Invalid changelog record at offset {message.offset()}: {exc}"
                    ) from exc

                if latest is not None:
                    previous_sequence = latest["sequence"]
                    current_sequence = envelope["sequence"]

                    if current_sequence < previous_sequence:
                        raise ValueError("Changelog sequence moved backwards")

                    if current_sequence == previous_sequence:
                        if (
                            envelope["snapshot_id"] == latest["snapshot_id"]
                            and envelope["checksum"] == latest["checksum"]
                        ):
                            continue
                        raise ValueError("Conflicting snapshots have the same sequence")

                latest = envelope

            return latest

        finally:
            consumer.close()

    def load_latest_snapshot(self) -> dict[str, Any] | None:
        """Read and return the latest validated snapshot state."""
        envelope = self._read_latest_envelope()
        return None if envelope is None else envelope["state"]

    def publish_snapshot(
        self,
        records: dict[str, Any],
        snapshot_id: str | None = None,
    ) -> dict[str, Any]:
        """Publish a complete snapshot and wait for broker acknowledgement."""
        with self._lock:
            previous = self._read_latest_envelope()
            sequence = 1 if previous is None else previous["sequence"] + 1

            envelope = self._build_envelope(
                sequence=sequence,
                snapshot_id=snapshot_id or str(uuid.uuid4()),
                records=records,
            )

            payload = self._canonical_json(envelope)
            delivery = {"done": False, "error": None}

            def on_delivery(error, message):
                delivery["error"] = error
                delivery["done"] = True

            self._producer.produce(
                self.topic,
                key=self.MESSAGE_KEY,
                value=payload,
                partition=self.PARTITION,
                callback=on_delivery,
            )

            deadline = time.monotonic() + self.timeout

            while not delivery["done"]:
                if time.monotonic() >= deadline:
                    raise TimeoutError("Kafka snapshot acknowledgement timed out")
                self._producer.poll(0.1)

            if delivery["error"] is not None:
                raise RuntimeError(
                    f"Kafka snapshot publish failed: {delivery['error']}"
                )

            return envelope

    def close(self) -> None:
        """Flush outstanding producer messages."""
        remaining = self._producer.flush(self.timeout)
        if remaining:
            raise TimeoutError(
                f"{remaining} Kafka changelog message(s) remain undelivered"
            )

