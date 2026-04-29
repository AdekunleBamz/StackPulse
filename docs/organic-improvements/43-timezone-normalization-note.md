# Timezone Normalization

- Normalize timestamps to UTC for storage and processing.
- Apply local timezone formatting only at display layer.
- This avoids cross-region alert ordering issues.

- Normalize all stored timestamps to UTC at write time.
