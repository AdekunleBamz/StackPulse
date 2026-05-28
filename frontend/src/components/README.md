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
- Keep animation timing consistent across notification and loading components to avoid jarring UX during high event volume.
- When adding new icon-only controls, provide matching `title` text and screen-reader labels so hover hints and accessibility copy stay aligned.
- Recheck empty, loading, and error states together when introducing dashboard components.
- Keep component examples current when shared UI primitives change props.
