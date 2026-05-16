# Frontend env redaction note

Deployment evidence should show `NEXT_PUBLIC_*` variable names without copying private project values.

If a preview bug depends on an environment value, record the Vercel environment and variable name only.

Keep project IDs and team IDs out of public screenshots unless the release owner explicitly approves them.
