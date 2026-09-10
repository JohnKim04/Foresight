# Foresight Implementation Notes

> **Current MVP scope:** The active build is a local iOS and Android free-form text journal with no LLM or structured-data layer. Follow [mvp-plan.md](mvp-plan.md) and its linked build notes for implementation decisions. The ideas below are retained for later consideration and are not current MVP requirements.

Early technical decisions and open questions. This document records how product ideas may be implemented; it is not a finalized architecture.

## Input and Parsing

Foresight supports two equivalent ways to log an entry:

- Free-form typing
- Voice, transcribed into text

Neither is the primary mode. Both feed the same natural-language parsing flow.

## LLM Assisted Parsing

An LLM is useful for translating a natural-language entry into a proposed structured record, but it must not be the source of truth.

### Source of Truth

The original typed entry or voice transcript is saved as the immutable raw log. Every extracted field remains traceable back to that log.

### Proposed Structured Record

The LLM may propose fields such as:

- Habits or events
- Time and context
- Before and after mood or feeling
- Stated outcome or consequence
- Tags and categories

The record is a draft. The person can edit, accept, or reject the extraction, especially when a field affects a future pattern or nudge.

### Deterministic Product Logic

Use regular application logic, rather than an LLM, for:

- Timestamps and schedules
- Follow-up reminders
- Mood and feeling scores
- Pattern calculations and correlation statistics
- Eligibility for proactive nudges

An LLM can help phrase a summary, but any statement about a pattern must be backed by confirmed data and should avoid implying causation.

## Example Flow

1. A person types or says: “I didn't want to work out, but I did 30 minutes and felt noticeably calmer after.”
2. The raw entry is stored.
3. The LLM proposes: workout, 30 minutes, low motivation before, calmer after, positive immediate outcome.
4. The person can correct or confirm the proposal.
5. Confirmed fields contribute to later habit, mood, feeling, and consequence patterns.

## Product Principle

The LLM is the translator, not the database or analytics engine. The product should make it easy to see the original log, correct its interpretation, and understand why an insight or nudge appeared.

## Open Questions

- What is the smallest structured event schema needed for the first version?
- Which fields require explicit confirmation, and which can remain private AI suggestions?
- How should the app display confidence and uncertainty without adding friction?
- What data should remain on device, and what requires a server?
- How much evidence is required before a pattern can trigger a proactive nudge?
