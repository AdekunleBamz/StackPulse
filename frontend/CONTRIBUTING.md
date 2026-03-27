# Contributing to StackPulse Frontend

This guide explains how to contribute safely and consistently to the Next.js frontend package.

## Local setup

- Install dependencies from repo root with `npm install` and `npm --prefix frontend install`.
- Copy `frontend/.env.example` to `.env.local` and set the server/deployer values for your environment.

## Running the app

- Start local dev mode with `npm --prefix frontend run dev`.
- Run `npm --prefix frontend run lint` before opening a pull request.
- Validate production output with `npm --prefix frontend run build` for UI-heavy changes.

## Branch strategy

- Keep each branch focused on one UI behavior, bug fix, or docs concern.
- Rebase or merge frequently from `main` to reduce frontend integration drift.

## Coding style

- Prefer explicit TypeScript types for component props and hook return values.
- Preserve keyboard accessibility, labels, and focus states for interactive controls.
- Use shared constants/types from `@stackpulse/shared` when values exist there already.

## Validation checklist

- `npm --prefix frontend run lint` passes with no new warnings.
- `npm --prefix frontend run build` succeeds after page-level changes.
- Verify affected pages in both desktop and mobile viewport sizes.

## Pull request expectations

- Summarize user-facing behavior changes in plain language.
- Include screenshots or short recordings for visual updates.
- Update nearby docs when commands, routes, or env requirements change.

## Commit messages

- Use concise prefixes such as `fix(frontend):`, `feat(frontend):`, or `docs(frontend):`.
- Keep commits signed to preserve verified history for frontend changes.

## Review etiquette

- Respond to review feedback with follow-up commits instead of force-pushing unrelated rewrites.
- Keep review conversations focused on behavior, accessibility, and maintainability.

## Release note hygiene

- Add notable UX changes to `frontend/CHANGELOG.md` in the same branch.
- Call out backend API dependency changes when frontend request paths are updated.
- Keep housekeeping-only commits small and clearly labeled as maintenance.
