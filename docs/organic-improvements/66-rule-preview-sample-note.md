# Rule Preview Sample Note

## Summary
Rule preview checks should use a representative alert payload before a new monitoring rule is saved.

## Checks
- Preview the rule against at least one matching and one non-matching sample.
- Confirm sample payloads do not include private webhook secrets.
- Save the rule only after the preview outcome matches the alert owner expectation.
