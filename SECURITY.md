# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of StackPulse seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to [security@stackpulse.io](mailto:security@stackpulse.io) with a detailed description of the issue, steps to reproduce it, and any potential impact.
Please redact secrets (mnemonics, API tokens, `.env` values) from all reports and logs.
You can also use GitHub"""s private advisory flow: https://github.com/AdekunleBamz/StackPulse/security/advisories/new

We will provide regular status updates until the issue is resolved.
- For blockchain-related findings, include network (mainnet/testnet) and at least one transaction or block reference where behavior was observed.

- Security ops tip: rotate webhook signing material after incident response events.
