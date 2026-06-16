# Price feed staleness note

Keep price feed freshness in dashboard smoke checks so derived alert thresholds do not look current when upstream data is stale.

## Checklist

- Verify the last-updated timestamp near price-dependent metrics.
- Confirm stale data uses a visible warning before alert tuning.
