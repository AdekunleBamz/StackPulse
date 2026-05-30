# WebSocket stale subscription

When a WebSocket reconnects, verify stale subscriptions are cleared before new
filters are attached so duplicate dashboard events do not appear.
