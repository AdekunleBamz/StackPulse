# Contributing to StackPulse

Thank you for your interest in contributing to StackPulse! We welcome help from the community to make our blockchain monitoring system even better.

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## 🛠️ Getting Started

1. **Fork the Repo**: Create your own fork of the repository.
2. **Setup Dev Environment**: Follow the instructions in [README.md](README.md) to install dependencies.
3. **Sign Your Commits**: We require all commits to be signed for security and verification.
   ```bash
   git config --global user.signingkey <your-key-id>
   git commit -S -m "Your commit message"
   ```

## 🌿 Branching Strategy

- `main`: Production-ready code.
- `feat/*`: New features.
- `fix/*`: Bug fixes.
- `docs/*`: Documentation updates.

## 🧪 Testing Guidelines

Before submitting a pull request, ensure that all tests pass:

```bash
# Frontend checks
npm --prefix frontend run lint

npm install
npm --prefix server ci
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
npm run clarinet:test

# Server
npm --prefix server run build
npm --prefix server run test

# Frontend
npm --prefix frontend run lint
npm --prefix frontend run build
```

## 📝 Pull Request Process

1. Create a descriptive branch name.
2. Follow the [conventional commits](https://www.conventionalcommits.org/) specification.
3. Update relevant documentation.
4. Ensure CI passing (if applicable).
5. Request a review from maintainers.

## 🛡️ Security Vulnerabilities

Please do not report security vulnerabilities via GitHub issues. Refer to [SECURITY.md](SECURITY.md) for our reporting process.

---

## Documentation hygiene

- Prefer updating an existing nearby README before adding a disconnected note.
- Call out versioned or legacy behavior explicitly when older docs remain in the tree.
- Avoid leaving stale deployment plan names, route paths, or package commands in docs.
- Small docs-only PRs should still explain operational context in the description (what changed and why now).
