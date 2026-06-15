# API pagination boundary note

Keep API pagination boundaries in regression notes so alert and event lists do not skip records at page edges.

## Checklist

- Test the first, middle, and final pages for a populated event list.
- Confirm the displayed count matches the API response count.
