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
