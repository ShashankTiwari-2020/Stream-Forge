import pytest
from pydantic import ValidationError

from backend.app.streaming.transforms import transform_temperature_event


def sample_event(temperature=5.8):
    return {
        "event_id": "event-001",
        "truck_id": "TRUCK-101",
        "temperature": temperature,
        "timestamp": "2026-11-04T10:00:00+00:00",
    }


def test_positive_temperature_is_accepted():
    result = transform_temperature_event(sample_event(5.8))
    assert result is not None
    assert result["temperature"] == 5.8
    assert result["truck_id"] == "TRUCK-101"


def test_zero_temperature_is_filtered():
    assert transform_temperature_event(sample_event(0)) is None


def test_negative_temperature_is_filtered():
    assert transform_temperature_event(sample_event(-5)) is None


def test_invalid_event_is_rejected():
    event = sample_event()
    del event["event_id"]

    with pytest.raises(ValidationError):
        transform_temperature_event(event)


def test_naive_timestamp_is_normalized_to_utc():
    event = sample_event()
    event["timestamp"] = "2026-11-04T10:00:00"

    result = transform_temperature_event(event)
    assert result["timestamp"] == "2026-11-04T10:00:00+00:00"
