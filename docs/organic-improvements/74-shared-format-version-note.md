# Shared Format Version Note

## Summary
Shared format changes should name the expected package version before frontend and server releases are compared.

## Checks
- Record the shared package version used by the server build.
- Confirm the frontend bundle was built against the same shared format version.
- Include parse fallback behavior when a version mismatch is reported.
