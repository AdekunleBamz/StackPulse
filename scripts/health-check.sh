#!/bin/bash

# StackPulse Health Check Script
# Periodically pings the server health endpoint

SERVER_URL=${1:-"http://localhost:3000"}
HEALTH_ENDPOINT="/api/v1/health"
INTERVAL=60

echo "Starting health check for $SERVER_URL$HEALTH_ENDPOINT..."

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVER_URL$HEALTH_ENDPOINT")
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

  if [ "$STATUS" -eq 200 ]; then
    echo "[$TIMESTAMP] OK: Server is healthy (Status 200)"
  else
    echo "[$TIMESTAMP] ERROR: Server unhealthy (Status $STATUS)"
  fi

  sleep $INTERVAL
done
