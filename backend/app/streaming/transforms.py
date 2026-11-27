from datetime import timezone

from backend.app.schemas.events import TemperatureEvent


def transform_temperature_event(payload: dict) -> dict | None:
    """Validate, filter, and normalize a temperature event."""
    event = TemperatureEvent.model_validate(payload)

    # Filter: accept only positive temperatures.
    if event.temperature <= 0:
        return None

    # Normalize timestamp to UTC.
    timestamp = event.timestamp

    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    else:
        timestamp = timestamp.astimezone(timezone.utc)

    # Map: return a normalized event.
    return {
        "event_id": event.event_id,
        "truck_id": event.truck_id,
        "temperature": event.temperature,
        "timestamp": timestamp.isoformat(),
    }
