# Alert Deduplication Window

- Deduplicate identical alerts within a short rolling window.
- Show occurrence count on the surviving alert entry.
- This limits repeated notifications during noisy bursts.

- Rotate dedup keys with release tags to avoid stale suppression after migrations.
