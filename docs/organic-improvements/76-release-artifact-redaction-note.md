# Release Artifact Redaction Note

## Summary
Release artifacts should be checked for secrets and customer-specific alert details before they are shared.

## Checks
- Inspect build logs, screenshots, and exported alert samples.
- Remove webhook URLs, API keys, and private account labels.
- Keep sanitized event IDs when they help reviewers verify the release.
