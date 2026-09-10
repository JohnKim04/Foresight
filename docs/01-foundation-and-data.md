# Chunk 1: Foundation and Data

## Goal

Create an Expo/React Native mobile application with a small, testable persistence boundary for journal entries.

## Decision

Use React Native AsyncStorage for this MVP. It is local to the device, works offline, and needs no account or server. This is intentionally a single-device prototype; sync and export remain future work.

## Entry contract

```text
id          stable opaque string
body        non-empty trimmed text
eventAt     ISO-8601 timestamp chosen by the person
createdAt   ISO-8601 timestamp set when first saved
updatedAt   ISO-8601 timestamp set when edited
```

The body is the only required user-provided content. There are no AI fields, tags, scores, categories, or analytics fields.

## Behaviors

- Store all entries under one versioned storage key.
- Validate parsed storage data before use; ignore invalid individual entries rather than allowing one bad record to break the journal.
- When the entire persisted value cannot be read, leave it untouched until the person explicitly chooses recovery. Recovery moves the unreadable value to a timestamped backup key and resets the active journal storage.
- Sort history by `eventAt`, newest first.
- Updating an entry preserves `id` and `createdAt`, and refreshes `updatedAt`.

## Acceptance evidence

TypeScript tests cover create, update, sorting, AsyncStorage persistence, invalid-record filtering, and corrupt-storage recovery. Expo can bundle the app for iOS and Android without a backend.
