# Server Routes

API route definitions and controller logic for the StackPulse server.

## Route Modules

- `auth`: Authentication and user registration.
- `alerts`: Alert management CRUD operations.
- `stats`: User and system-wide statistics.
- `health`: System health check and heartbeats.

## Guidelines

- Routes should focus on request parsing and responding.
- Delegate complex business logic to the service layer.
- Use async/await for all asynchronous operations.
