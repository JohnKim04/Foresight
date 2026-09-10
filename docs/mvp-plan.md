# Foresight Mobile Logging MVP Plan

## Outcome

Deliver a small, private, low-friction mobile journal for iOS and Android that makes it easy to record free-form life logs. The first release proves that people will consistently capture what happened in their own words before Foresight tries to interpret, remind, or advise them.

## Working agreement

This file and its linked build notes are the source of truth for planning and development. Do not update Linear unless the user explicitly asks to **sync with Linear**.

## MVP scope

The MVP does one thing well: save and revisit free-form text logs in a native mobile experience.

- **Basic mobile UI:** Provide a simple, usable interface for writing, saving, browsing, reading, and editing entries on an iOS or Android device.
- **Write:** Enter a note in plain text and save it quickly.
- **Timestamp:** Store when the note was created, with the option to correct the event time if needed.
- **History:** Browse logs in reverse chronological order and reopen an entry.
- **Edit:** Correct the text or event time of a saved entry while retaining clear created/updated timestamps.
- **Privacy:** Keep data private by default.

Each entry needs only a stable ID, text body, event time, creation time, and update time. Do not require categories, ratings, habits, moods, tags, or structured fields.

## Immediate implementation sequence

1. **Define the logging contract.** Confirm the minimal entry schema, persistence approach, edit behavior, and empty/error states.
2. **Scaffold the mobile app and persistence layer.** Create the Expo/React Native application shell, basic mobile UI, and storage for journal entries. Handle loading, saving, and migration safely.
3. **Build the write flow.** Implement a focused text-entry screen with a clear save action and an immediate success state.
4. **Build log history and detail.** Render entries in reverse chronological order; provide a readable entry view and an edit path.
5. **Test the essential data lifecycle.** Verify an entry can be created, reopened, edited, and persist across an app restart; verify the empty state and malformed-data recovery.
6. **Validate repeat capture.** Use the app personally or with a small early group to see whether the logging interaction is fast and natural enough to use repeatedly.

## Product and technical guardrails

- No LLM, transcription, data extraction, classification, or automated interpretation in this MVP.
- No prompts, reminders, ratings, analytics, patterns, or proactive nudges.
- No required taxonomy: people write in their own words.
- Persist only the information required to support the log, and make the storage model easy to inspect and export later.
- Keep the persistence boundary replaceable so secure sync can be introduced later without changing the journal experience.

## Deliberately deferred

- Voice capture and transcription
- AI-assisted extraction or summaries
- Check-ins, mood/outcome ratings, and pattern analysis
- Notifications and proactive nudges
- Tags, categories, habits, and custom tracking schemas
- Third-party integrations, cross-device sync, accounts, and social features
- Push and PR are deferred

## Success signals

- A person can save a useful note in seconds with no setup burden.
- Logs persist reliably and are easy to find and read later.
- People return to record multiple entries over time.
- Users describe the experience as private, calm, and low-friction.

## Build notes

The MVP is deliberately split into small, durable implementation notes. These are the source of truth for the corresponding code work and verification:

- [Foundation and data](01-foundation-and-data.md)
- [Mobile journal UI](02-journal-ui.md)
- [Verification checklist](03-verification.md)
