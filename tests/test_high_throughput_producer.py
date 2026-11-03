import pytest

from backend.app.kafka import high_throughput_producer as producer_module
from backend.app.kafka.high_throughput_producer import (
    HighThroughputTemperatureProducer,
)


class MockKafkaProducer:
    def __init__(self, config):
        self.config = config
        self.messages = []
        self.poll_calls = []
        self.flush_calls = []

    def produce(self, topic, key, value, on_delivery):
        self.messages.append({
            "topic": topic,
            "key": key,
            "value": value,
            "callback": on_delivery,
        })

    def poll(self, timeout):
        self.poll_calls.append(timeout)

    def flush(self, timeout):
        self.flush_calls.append(timeout)
        return 0


@pytest.fixture
def mock_producer(monkeypatch):
    monkeypatch.setattr(
        producer_module,
        "Producer",
        MockKafkaProducer,
    )

    return HighThroughputTemperatureProducer()


def sample_event():
    return {
        "event_id": "event-001",
        "truck_id": "TRUCK-101",
        "temperature": 5.5,
        "timestamp": "2026-10-31T10:00:00+00:00",
    }


def test_producer_sends_valid_event(mock_producer):
    mock_producer.send_event(sample_event())

    assert len(mock_producer.producer.messages) == 1

    message = mock_producer.producer.messages[0]

    assert message["topic"] == "temperature-events"
    assert message["key"] == b"TRUCK-101"
    assert b"event-001" in message["value"]


def test_producer_rejects_missing_fields(mock_producer):
    event = {
        "event_id": "event-002",
        "truck_id": "TRUCK-101",
    }

    with pytest.raises(ValueError, match="Missing event fields"):
        mock_producer.send_event(event)

    assert len(mock_producer.producer.messages) == 0


def test_delivery_callback_tracks_success(mock_producer):
    mock_producer.send_event(sample_event())

    callback = mock_producer.producer.messages[0]["callback"]
    callback(None, None)

    assert mock_producer.get_stats() == {
        "delivered": 1,
        "failed": 0,
    }


def test_delivery_callback_tracks_failure(mock_producer):
    mock_producer.send_event(sample_event())

    callback = mock_producer.producer.messages[0]["callback"]
    callback("Kafka delivery error", None)

    assert mock_producer.get_stats() == {
        "delivered": 0,
        "failed": 1,
    }


def test_producer_flushes_messages(mock_producer):
    remaining = mock_producer.flush(timeout=10)

    assert remaining == 0
    assert mock_producer.producer.flush_calls == [10]


def test_producer_configuration_enables_idempotence(mock_producer):
    config = mock_producer.producer.config

    assert config["enable.idempotence"] is True
    assert config["acks"] == "all"
    assert config["compression.type"] == "gzip"
