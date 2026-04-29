# Subscription Validation

- Validate subscription payloads at API boundary before persistence.
- Return field-level validation errors for quick correction.
- This keeps invalid alert rules out of runtime queues.

- Reject unknown plan tiers at the edge and log the rejected payload shape.
