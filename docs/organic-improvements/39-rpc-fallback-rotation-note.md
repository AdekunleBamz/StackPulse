# RPC Fallback Rotation

- Rotate through fallback RPC providers on repeated timeout failures.
- Record provider-switch events for visibility.
- This improves uptime during endpoint instability.

- Add a cool-down interval before reusing a degraded RPC endpoint.
