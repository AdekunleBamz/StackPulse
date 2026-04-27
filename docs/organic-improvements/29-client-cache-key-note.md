# Client Cache Key Strategy

- Include network and alert type in client cache keys.
- Invalidate only affected keys after updates.
- This keeps dashboard views fresh without overfetching.
