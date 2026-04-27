# Webhook Delivery Timeout

- Set explicit webhook delivery timeout boundaries.
- Treat timeout as retriable failure with jittered backoff.
- This improves predictable behavior under network delays.
