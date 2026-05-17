# Alert Delivery Correlation

## Summary
Alert delivery logs should preserve a shared correlation identifier from ingestion through notification.

## Checks
- Carry request or event IDs through chainhook handlers.
- Include the correlation ID in webhook retry logs.
- Use the same ID when escalating delivery failures.
