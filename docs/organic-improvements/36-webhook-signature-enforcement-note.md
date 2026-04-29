# Webhook Signature Enforcement

- Require signature verification for inbound and outbound webhook paths.
- Reject unsigned payloads with explicit security logs.
- This hardens integration boundaries.

- Reject unsigned callbacks with explicit metrics so enforcement gaps are visible.
