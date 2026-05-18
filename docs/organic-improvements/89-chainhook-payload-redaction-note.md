# Chainhook Payload Redaction

## Summary
Chainhook payload examples should avoid secrets and unnecessary user-identifying fields in support notes.

## Checks
- Redact webhook secrets before sharing payload screenshots.
- Keep transaction ids only when they are needed for replay.
- Confirm fixtures do not include private keys or mnemonics.
