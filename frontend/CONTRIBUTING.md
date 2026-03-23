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
