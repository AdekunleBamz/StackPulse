# Release Artifact Cleanliness

## Summary
Build artifacts and local deployment metadata should stay out of StackPulse commits.

## Checks
- Inspect git status after frontend and server builds.
- Leave `.next/`, coverage, and `.vercel/` metadata uncommitted.
- Confirm `.gitignore` covers all generated build folders.
- Explain any intentional generated artifact in release notes.
