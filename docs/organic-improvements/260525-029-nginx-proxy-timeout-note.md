# Nginx proxy timeout note

Document a deployment review item for nginx proxy timeout values used by streaming routes.

Timeouts should be high enough for websocket handshakes without masking broken upstream health.
