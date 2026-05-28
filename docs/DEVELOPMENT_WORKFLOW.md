# Development Workflow

This document outlines the standard workflow for contributing to StackPulse.

## Branching Strategy

- **main**: Production-ready code.
- **feature/***: New features and improvements.
- **fix/***: Bug fixes.
- **docs/***: Documentation updates.

## Local Development Loop

1. **Pull latest changes**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a topic branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies** (if changed):
   ```bash
   npm install
   ```

4. **Run tests**:
   ```bash
   npm test
   # plus area-specific tests
   ```

5. **Commit changes**:
   Use atomic, signed commits with clear messages.
   ```bash
   git commit -S -m "feat: add whale transfer alert"
   ```

6. **Push and Open PR**:
   ```bash
   git push origin feature/your-feature-name
   gh pr create --fill
   ```

## Code Style

- Use Prettier for formatting.
- Ensure TypeScript types are updated in the `shared` package if they affect multiple components.
- Keep components small and focused.

- Workflow tip: include a short risk summary before merging operational changes.
- Workflow tip: if a change introduces deferred follow-up work, capture an explicit owner and due date in the PR description.
- Workflow tip: attach command output for lint and build checks when touching release-facing docs.
