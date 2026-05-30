# Security Policy

## Supported Versions

Security updates are provided for the following versions of StackPulse:

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

We take the security of StackPulse seriously. If you believe you have found a security vulnerability, please report it to us by emailing [bams.kunle@gmail.com](mailto:bams.kunle@gmail.com).

Please include the following in your report:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

Instead, please send an email to [security@stackpulse.io](mailto:security@stackpulse.io) with a detailed description of the issue, steps to reproduce it, and any potential impact.
Please redact secrets (mnemonics, API tokens, `.env` values) from all reports and logs.
You can also use GitHub"""s private advisory flow: https://github.com/AdekunleBamz/StackPulse/security/advisories/new

We will provide regular status updates until the issue is resolved.
- For blockchain-related findings, include network (mainnet/testnet) and at least one transaction or block reference where behavior was observed.
- Avoid attaching full `.env` files, private keys, wallet mnemonics, or unredacted webhook secrets.
