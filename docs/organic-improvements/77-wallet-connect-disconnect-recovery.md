# Wallet connect disconnect recovery

Keep connect and disconnect recovery in wallet QA so account context does not leak between monitoring sessions.

## Checklist

- Connect a wallet, disconnect, and reload the dashboard.
- Confirm protected actions return to the signed-out state.
