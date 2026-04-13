# Contributing to StackPulse

Thank you for your interest in contributing to StackPulse! We welcome help from the community to make our blockchain monitoring system even better.

## 📜 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## 🛠️ Getting Started

1. **Fork the Repo**: Create your own fork of the repository.
2. **Setup Dev Environment**: Follow the instructions in [README.md](README.md) to install dependencies.
3. **Sign Your Commits**: We require all commits to be GPG-signed for security and verification.
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
# Frontend tests
npm --prefix frontend test

# Backend tests
npm --prefix server test

# Shared package tests
npm --prefix shared test

# Clarity contract checks
npm run clarinet:check
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

Built with ❤️ by [AdekunleBamz](https://github.com/AdekunleBamz) and the community.
