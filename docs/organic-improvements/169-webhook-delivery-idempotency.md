# Webhook delivery idempotency

Webhook retries should include an idempotency key derived from event id and
channel id so receivers can safely de-duplicate delivery attempts.
