# Contributing to StackPulse

Use small, reviewable changes and keep documentation close to the code it describes.

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/StackPulse.git
cd StackPulse

npm install
npm --prefix server ci
npm --prefix frontend install
npm --prefix shared install
```

## Day-to-day workflow

1. Start from a branch or worktree based on the latest `main`.
2. Keep changes scoped to one concern when possible.
3. Update nearby docs or READMEs when commands, routes, or file layout change.
4. Run the checks that match the area you touched.
5. Create signed commits with clear messages.

## Branch naming

Use descriptive prefixes to categorize your work:
- `feat/`: New features or significant enhancements
- `fix/`: Bug fixes
- `docs/`: Documentation updates
- `refactor/`: Code structural changes without behavioral impact
- `test/`: Adding or improving tests
- `chore/`: Maintenance tasks (dependencies, config)

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
