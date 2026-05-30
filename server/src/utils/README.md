# Server Utilities

Low-level helpers shared across the backend.

## Modules in this folder

- `logger.ts`: centralized Winston logger configuration
- `stacks.ts`: Stacks API helpers plus event parsing utilities used by chainhook handlers
- `webhook.ts`: webhook payload validation, signature generation, signature verification, and outbound delivery helpers

## Working rules

- Keep helpers narrowly scoped and easy to test.
- Prefer pure functions unless a utility truly owns external I/O.
- Update service docs if a utility becomes part of a public integration contract.
- Redact sensitive headers and auth tokens in helper-level logs before they are forwarded to centralized logging sinks.
- Add unit coverage notes when utility helpers normalize external payload shapes.
