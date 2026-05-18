# Pricing refresh backoff

Pricing refreshes should use a documented backoff window so temporary API errors
do not flood logs or alert channels.
