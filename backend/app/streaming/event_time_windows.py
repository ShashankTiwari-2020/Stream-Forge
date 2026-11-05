from collections import defaultdict
from datetime import datetime, timedelta, timezone


class EventTimeWindowAggregator:
    """Aggregate temperature events into fixed event-time windows."""

    def __init__(
        self,
        window_minutes: int = 5,
        allowed_lateness_minutes: int = 1,
    ):
        if window_minutes <= 0:
            raise ValueError("window_minutes must be positive")

        if allowed_lateness_minutes < 0:
            raise ValueError("allowed_lateness_minutes cannot be negative")

        self.window = timedelta(minutes=window_minutes)
        self.allowed_lateness = timedelta(
            minutes=allowed_lateness_minutes
        )

        self._windows = defaultdict(dict)
        self._max_event_time = {}
        self._seen_ids = set()

    @staticmethod
    def _normalize_timestamp(value):
        if isinstance(value, str):
            value = datetime.fromisoformat(value)

        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc)

    def _get_window_start(self, timestamp):
        window_seconds = self.window.total_seconds()
        timestamp_seconds = timestamp.timestamp()

        start_seconds = (
            timestamp_seconds // window_seconds
        ) * window_seconds

        return datetime.fromtimestamp(
            start_seconds,
            tz=timezone.utc,
        )

    def _build_window_result(self, truck_id, window_start, events):
        temperatures = [
            event["temperature"] for event in events.values()
        ]

        return {
            "truck_id": truck_id,
            "window_start": window_start.isoformat(),
            "window_end": (
                window_start + self.window
            ).isoformat(),
            "window_minutes": self.window.total_seconds() / 60,
            "reading_count": len(temperatures),
            "average_temperature": round(
                sum(temperatures) / len(temperatures), 2
            ),
            "minimum_temperature": min(temperatures),
            "maximum_temperature": max(temperatures),
        }

    def process(self, event: dict) -> dict:
        """Accept an event and emit any windows closed by its watermark."""

        event_id = event["event_id"]
        truck_id = event["truck_id"]

        if event_id in self._seen_ids:
            return {
                "status": "duplicate",
                "finalized_windows": [],
            }

        timestamp = self._normalize_timestamp(event["timestamp"])
        window_start = self._get_window_start(timestamp)
        window_end = window_start + self.window

        previous_max = self._max_event_time.get(truck_id)

        if previous_max is not None:
            watermark = previous_max - self.allowed_lateness

            if window_end <= watermark:
                return {
                    "status": "late",
                    "event_id": event_id,
                    "truck_id": truck_id,
                    "window_start": window_start.isoformat(),
                    "window_end": window_end.isoformat(),
                    "watermark": watermark.isoformat(),
                    "finalized_windows": [],
                }

        self._seen_ids.add(event_id)

        self._windows[truck_id][window_start] = (
            self._windows[truck_id].get(window_start, {})
        )

        self._windows[truck_id][window_start][event_id] = event

        if previous_max is None or timestamp > previous_max:
            self._max_event_time[truck_id] = timestamp

        watermark = (
            self._max_event_time[truck_id] - self.allowed_lateness
        )

        finalized = []

        for start in sorted(list(self._windows[truck_id])):
            if start + self.window <= watermark:
                events = self._windows[truck_id].pop(start)

                finalized.append(
                    self._build_window_result(
                        truck_id,
                        start,
                        events,
                    )
                )

        return {
            "status": "accepted",
            "event_id": event_id,
            "truck_id": truck_id,
            "finalized_windows": finalized,
        }
