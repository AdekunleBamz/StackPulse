# WebSocket message parse

Malformed WebSocket messages should log a safe parse failure and keep the socket
open unless the protocol explicitly requires disconnecting.
