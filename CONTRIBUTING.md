# Contributing to StackPulse

Use small, reviewable changes and keep documentation close to the code it describes.

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/StackPulse.git
cd StackPulse

npm install
npm --prefix server install
npm --prefix frontend install
npm --prefix shared install
```

## Branching Strategy

We follow a feature-branch workflow:
- `main`: Production-ready code.
- `feat/*`: New features.
- `fix/*`: Bug fixes.
- `docs/*`: Documentation changes.
- `refactor/*`: Code refactoring without functional changes.

## Pull Request Process

1.  **Branch**: Create a new branch from `main`.
2.  **Develop**: Make your changes, ensuring they follow the project's coding standards.
3.  **Test**: Verified your changes with local tests (`npm test`, `npm run build`).
4.  **Commit**: Create descriptive, atomic, and **GPG-signed** commits.
5.  **Open PR**: Open a Pull Request with a clear title and description of the changes.
6.  **Review**: Address any feedback from maintainers.
7.  **Merge**: Once approved, your PR will be merged into `main`.

## Technological Focus

### Frontend
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Hooks & Context API
- **Web3**: Stacks.js & Stacks Connect

### Backend (Server)
- **Runtime**: Node.js
- **API**: Express
- **Integration**: Hiro API & Chainhooks

### Contracts
- **Language**: Clarity
- **Tooling**: Clarinet

## Signed Commits

All contributions must be signed using GPG or SSH. Signing verifies the authenticity of the author.

```bash
git commit -S -m "feat(frontend): add real-time validation"
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
