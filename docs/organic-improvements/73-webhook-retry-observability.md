# Webhook retry observability

Webhook retries should log attempt count, next delay, and final delivery status
without logging the signed payload body.
