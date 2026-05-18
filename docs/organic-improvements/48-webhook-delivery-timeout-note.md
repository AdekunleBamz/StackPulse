# Webhook Delivery Timeout

- Set explicit webhook delivery timeout boundaries.
- Treat timeout as a retriable failure with jittered backoff.
- This improves predictable behavior under network delays.

- Align timeout and retry backoff so channel retries are predictably bounded.
