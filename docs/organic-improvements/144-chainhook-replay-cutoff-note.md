# Chainhook replay cutoff note

Before replaying chainhook events, record the start block and the reason for the replay window.

Use a bounded replay range for incident recovery so old alerts are not resent to active notification channels.

After replay, compare delivered alert count against the expected event count.
