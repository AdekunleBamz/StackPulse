# Delivery retry jitter note

Keep retry jitter in webhook delivery reviews so downstream services are not hit by synchronized retry bursts.

## Checklist

- Confirm retry schedules include a small randomized delay.
- Watch delivery logs for repeated retries landing at the same second.
