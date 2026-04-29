# Event Schema Versioning

- Version event schemas explicitly in shared package contracts.
- Reject incompatible payload versions with clear error logs.
- This protects downstream consumers during upgrades.

- Keep a compatibility matrix for producer and consumer schema versions.
