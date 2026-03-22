# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-22

### Added
- Comprehensive test suite with Vitest including unit and integration tests.
- Webhook payload sanitization and signature verification for enhanced security.
- Global rate limiting for API routes to prevent DoS attacks.
- Structured request logging with Winston and compression middleware.
- Environment variable validation on server startup.
- Automated health check and staging deployment helper scripts.
- Mermaid architecture diagrams and updated contribution guidelines.

### Changed
- Refactored notification and websocket services for better state management.
- Improved frontend hero and footer responsiveness.
- Enhanced accessibility with proper ARIA labels across components.
- Standardized API error responses for better frontend consistency.

## [1.0.0] - 2026-03-22

### Added
- Initial release of StackPulse.
- Real-time Stacks blockchain monitoring.
- Ingestion server for Hiro Chainhooks.
- Next.js dashboard for alert visualization.
- Shared package for type safety across workspaces.
- Comprehensive project documentation and GitHub templates.
