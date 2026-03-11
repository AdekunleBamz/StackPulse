# Contributing to StackPulse

Thank you for your interest in contributing to StackPulse! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guides](#style-guides)
- [Testing](#testing)

## Code of Conduct

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch for your changes

## Development Environment

### Prerequisites

- Node.js >= 18
- npm or yarn
- Clarinet (for smart contract development)
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/StackPulse.git
cd StackPulse

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
CHAINHOOKS_API_KEY=your_hiro_api_key
CHAINHOOK_AUTH_TOKEN=your_webhook_secret
DEPLOYER_ADDRESS=your_stacks_address

# Frontend
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_DEPLOYER_ADDRESS=your_deployer_address
```

## Making Changes

1. Create a new branch for your feature or fix
2. Make your changes following our style guides
3. Add tests if applicable
4. Commit with descriptive messages
5. Push to your fork

### Branch Naming

- `feature/add-new-feature` - New features
- `fix/bug-description` - Bug fixes
- `docs/doc-section` - Documentation updates
- `refactor/code-improvement` - Code improvements

### Commit Messages

Use clear, descriptive commit messages:

```
feat(contracts): add subscription renewal function
- Add renew-subscription for extending existing subscriptions
- Add cancel-subscription for downgrading to free tier
- Emit events for chainhook integration
```

## Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Push your branch to GitHub
4. Create a Pull Request
5. Wait for review and address feedback

## Style Guides

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Clarity (Smart Contracts)

- Follow Clarity best practices
- Add comments for complex logic
- Use meaningful constant names
- Test thoroughly with Clarinet

### React/Next.js

- Use functional components with hooks
- Follow Next.js conventions
- Use TypeScript for props
- Keep components small and focused

## Testing

### Running Tests

```bash
# Root tests (Clarinet)
npm test

# Server tests
cd server && npm test

# Frontend tests  
cd frontend && npm test
```

### Writing Tests

- Write meaningful test descriptions
- Test edge cases
- Mock external dependencies
- Aim for high coverage on critical paths

## Project Structure

```
StackPulse/
├── contracts/          # Clarity smart contracts
├── chainhooks/         # Hiro Chainhook configurations
├── server/             # Express.js webhook server
├── frontend/           # Next.js frontend
├── docs/               # Documentation
└── tests/              # Contract tests
```

## Questions?

- Open an issue for bugs or feature requests
- Use discussions for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
