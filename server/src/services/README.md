# Server Services

Core business logic and external integrations for the StackPulse server.

## Primary Services

- `AlertService`: Logic for creating, updating, and triggering alerts.
- `StacksService`: Integration with the Stacks blockchain (RPC, API).
- `WebhookService`: Delivery and validation of alert notifications.
- `CacheService`: Redis-backed caching for performance optimization.

## Guidelines

- Services should be stateless whenever possible.
- Use dependency injection for better testability.
- Handle all external API failures gracefully with retries and logging.
