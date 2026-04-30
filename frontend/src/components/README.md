# Frontend Components

Reusable React components for the StackPulse frontend.

## Major groups

- landing and marketing: `Header`, `Features`, `Pricing`, `LiveStats`
- account and activity: `ConnectWallet`, `AlertHistory`, `BadgeShowcase`, `NotificationCenter`, `PriceTracker`
- feedback and resilience: `Toast`, `LoadingSkeleton`, `EmptyState`, `ErrorBoundary`, `NetworkStatus`, `ConfirmDialog`
- primitives: `ui/Button`, `ui/CopyButton`, `ui/TextField`

## Export surface

`index.ts` re-exports the stable shared component set. Update it when a component becomes part of the package-level API.

## Working rules

- Keep props typed and focused.
- Prefer composition over oversized components.
- Preserve accessible labels, focus states, and keyboard behavior when editing interactive UI.
