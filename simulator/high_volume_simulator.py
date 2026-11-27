import argparse
import random
import time
import uuid
from datetime import datetime, timezone

from backend.app.kafka.high_throughput_producer import (
    HighThroughputTemperatureProducer,
)


def generate_event(truck_count: int) -> dict:
    truck_number = random.randint(1, truck_count)

    return {
        "event_id": str(uuid.uuid4()),
        "truck_id": f"TRUCK-{truck_number:05d}",
        "temperature": round(random.uniform(2.0, 10.0), 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def run_simulator(event_count: int, truck_count: int) -> None:
    producer = HighThroughputTemperatureProducer()

    print("Starting high-volume temperature simulator")
    print(f"Events to publish: {event_count:,}")
    print(f"Simulated trucks: {truck_count:,}")

    start_time = time.perf_counter()

    try:
        for index in range(event_count):
            event = generate_event(truck_count)
            producer.send_event(event)

            if (index + 1) % 10000 == 0:
                print(f"Queued: {index + 1:,}/{event_count:,}")

        remaining = producer.flush(timeout=120)
        elapsed = time.perf_counter() - start_time
        stats = producer.get_stats()

        throughput = (
            stats["delivered"] / elapsed if elapsed > 0 else 0
        )

        print("\n========== PUBLISHING RESULTS ==========")
        print(f"Requested events: {event_count:,}")
        print(f"Delivered events: {stats['delivered']:,}")
        print(f"Failed events:    {stats['failed']:,}")
        print(f"Pending events:   {remaining:,}")
        print(f"Elapsed time:     {elapsed:.2f} seconds")
        print(f"Throughput:       {throughput:,.2f} events/second")
        print("========================================")

    finally:
        producer.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate high-volume truck temperature events."
    )
    parser.add_argument("--events", type=int, default=10000)
    parser.add_argument("--trucks", type=int, default=50000)

    args = parser.parse_args()

    if args.events <= 0 or args.trucks <= 0:
        parser.error("Events and trucks must be positive integers.")

    run_simulator(args.events, args.trucks)
