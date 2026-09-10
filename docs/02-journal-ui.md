# Chunk 2: Mobile Journal UI

## Goal

Provide a calm, accessible native mobile interface that makes writing the primary action and reviewing past logs frictionless.

## Required surfaces

- **Compose:** A labelled multiline text input, native event date/time picker, and Save action.
- **History:** Reverse-chronological list with timestamp, text preview, selected state, and a helpful empty state.
- **Entry detail:** Readable full text and metadata for the selected entry.
- **Edit:** Reuse the compose form for an existing entry, with Update and Cancel actions.
- **Recovery:** Clearly explain corrupt local data and offer a user-initiated recovery action.

## Interaction decisions

- Start on a blank compose form; writing is never hidden behind setup.
- Save is disabled until the note contains non-whitespace text.
- Event time defaults to the current local date and time but can be corrected before saving.
- Use the combined native date/time picker on iOS. On Android, collect the date and time in its two supported native picker steps and preserve both selections in one event timestamp.
- Selecting an existing log opens it for reading. Edit moves its data into the compose form. Cancelling returns to read mode without changing stored data.
- Use native React Native controls, accessible labels and roles, touch targets, and an announced status message for save/recovery feedback.

## Non-goals

Do not add authentication, a backend, tags, search, deletion, rich text, exports, reminders, or any automated interpretation in this chunk.

## Acceptance evidence

The UI runs locally in Expo on iOS and Android, uses no external runtime service, supports screen-reader labels and touch operation, and performs the complete create → read → edit → persist lifecycle.
