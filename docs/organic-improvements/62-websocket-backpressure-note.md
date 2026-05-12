# WebSocket backpressure note

Keep WebSocket backpressure behavior in incident drills so high event volume does not hide dropped updates from operators.

## Checklist

- Simulate a burst of chainhook events in staging.
- Confirm the dashboard shows stale or delayed state instead of silently freezing.
