# Chainhook Health Endpoint

- Track chainhook ingestion freshness via dedicated health endpoint.
- Return lag metrics for dashboard and pager integrations.
- This improves early detection of stalled ingestion.

- Alert when the health endpoint p95 latency drifts above your normal operating band.
