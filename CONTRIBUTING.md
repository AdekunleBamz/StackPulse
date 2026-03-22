# Contributing to StackPulse

Use small, reviewable changes and keep documentation close to the code it describes.

## Local setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AdekunleBamz/StackPulse.git
   cd StackPulse
   ```

2. **Install root dependencies**:
   ```bash
   npm install
   ```

3. **Initialize sub-workspaces**:
   ```bash
   # Backend server
   cd server && npm install && cd ..
   
   # Frontend application
   cd frontend && npm install && cd ..
   
   # Shared logic
   cd shared && npm install && cd ..
   ```

## Day-to-day workflow

1. Start from a branch or worktree based on the latest `main`.
2. Keep changes scoped to one concern when possible.
3. Update nearby docs or READMEs when commands, routes, or file layout change.
4. Run the checks that match the area you touched.
5. Create signed commits with clear messages.

## Signed commits

The repository already supports SSH commit signing. Prefer signed commits for all changes:

```bash
git commit -S -m "docs: refresh workspace notes"
```

## Useful checks

```bash
# Contracts
npm run clarinet:check
npm test

# Server
npm --prefix server run build
npm --prefix server test

# Frontend
npm --prefix frontend run lint
npm --prefix frontend run build

# Shared package
npm --prefix shared run build
```

## Testing guidelines

Maintain high coverage for new features:
- **Unit Tests**: Place in `tests/unit/` for pure logic (e.g., Stacks utilities, notification service).
- **Integration Tests**: Use `tests/webhook.test.ts` for verifying end-to-end event ingestion.
- **Contract Tests**: Add new `.clar` tests to `tests/` for any logic changes in smart contracts.
- **Frontend Tests**: Use Vitest for hook and component logic in the `frontend` directory.

All PRs should include relevant tests and pass on CI.

## Repo-specific expectations

- `server/src/index.ts` is the current source of truth for mounted backend endpoints.
- `server/src/routes/` contains extracted router modules that should stay aligned with the live API.
- Chainhook manifest names in `chainhooks/` should stay in sync with the server handlers they target.
- Shared constants and types should be updated together with the frontend or server code that consumes them.

## Commit messages

Use a short prefix and a direct summary:

```text
docs: clarify current API surface
fix(server): tighten request timeout handling
feat(frontend): add wallet status banner
```

## Documentation hygiene

- Prefer updating an existing nearby README before adding a disconnected note.
- Call out versioned or legacy behavior explicitly when older docs remain in the tree.
- Avoid leaving stale deployment plan names, route paths, or package commands in docs.
