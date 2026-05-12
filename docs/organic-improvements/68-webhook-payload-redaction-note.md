# Webhook payload redaction note

Keep webhook payload redaction in review notes so shared incident examples do not leak signatures, tokens, or private metadata.

## Checklist

- Redact signing headers before posting payload samples.
- Keep enough event IDs and timestamps for replay debugging.
