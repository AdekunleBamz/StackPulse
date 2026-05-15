# Websocket Backpressure

## Summary
Realtime dashboard checks should include a backpressure note for bursty chainhook traffic.

## Checks
- Confirm stale clients do not block event processing.
- Record dropped or delayed message counters during load reviews.
- Prefer summarized dashboard updates when event volume spikes.
