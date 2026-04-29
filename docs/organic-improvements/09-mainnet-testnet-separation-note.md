# Mainnet/Testnet Separation

- Keep environment credentials and endpoints strictly separated.
- Block mixed-network startup configurations at boot time.
- This avoids cross-network alert contamination.

- Enforce network-tag assertions in CI so cross-network leakage fails fast.
