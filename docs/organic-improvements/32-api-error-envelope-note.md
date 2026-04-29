# API Error Envelope

- Standardize API error envelopes for frontend consumption.
- Include correlation id and category in every error payload.
- This improves debuggability across services.

- Preserve correlation ids in error envelopes so traces stay joinable.
