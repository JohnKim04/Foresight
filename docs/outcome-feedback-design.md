# Outcome Feedback: Product Findings and Design Direction

## Recommendation

Foresight should not decide whether an action is good or bad. It should help a person build evidence about **how a particular episode affected them**, according to measures they care about.

The core loop is:

```text
Log an episode -> optionally name the activity -> check in after it -> review repeated personal outcomes
```

For example, `Alcohol` is not intrinsically a negative category and `Workout` is not intrinsically a positive one. A person may have a fun, connecting night out but poor next-day energy; a workout may improve their mood while leaving their body tired. Categories describe what happened. Outcome check-ins describe the person's reported effect in that specific context.

This makes the product useful without being moralizing, medically prescriptive, or misleadingly certain about cause and effect.

## The Smallest Useful Outcome Model

Every log may have zero or more outcome check-ins. A check-in should be optional, quick, and tied to a particular moment after the episode.

The default first question should be:

> Compared with before this, how do you feel now?

Use a five-point response, presented in words rather than as a bare number:

| Stored value | User-facing label |
| --- | --- |
| `-2` | Much worse |
| `-1` | A little worse |
| `0` | About the same |
| `1` | A little better |
| `2` | Much better |

`Not sure / too soon to tell` must be available and must not be stored as neutral. Neutral means the person perceived no meaningful change; uncertainty is different data.

This one overall answer is the minimum viable signal. It is fast enough to answer repeatedly and yields a clear distribution for later reflection. Do not require a mood score when the person logs an event; capture must remain diary-first.

## Keep Version One One-Dimensional

Do **not** build a collection of default dimensions yet. Mood, energy, stress, focus, body, sleep, connection, and satisfaction would make a short reflection feel like a form. They also risk producing sparse, incomparable data: a person might rate energy after drinking, mood after a workout, and nothing after scrolling.

The first outcome feature records only one answer: the overall better-to-worse comparison above. That answer is enough to establish the core product loop and provides an analysis signal that is easy to understand.

An optional free-text note may accompany an answer, but it should never be required. For example: “Fun night, but I slept terribly.” The original journal entry remains the richer context.

More specific dimensions are a possible later experiment, not an implied part of this release. Revisit them only if a clear need appears after the overall outcome loop exists. If they are added, they should be user-chosen and optional rather than a fixed battery of health scores.

## Timing: Immediate and Delayed Consequences

Many decisions feel good in the moment but differently later. The product therefore needs two distinct check-in moments:

| Check-in | Question | Typical timing | Purpose |
| --- | --- | --- | --- |
| Immediate | “How do you feel now?” | At log time or shortly afterward | Captures the in-the-moment outcome. |
| Delayed | “How has this affected you since?” | User-chosen delay, often next morning or next day | Captures the consequence after it has had time to emerge. |

The delayed prompt should never assume a category has a negative consequence. It should use neutral language and be easily dismissed: “Want to reflect on your late-night scrolling log from yesterday?”

At first, a person should explicitly choose whether to create a later check-in and when. Good preset choices are `Later today`, `Tomorrow morning`, `Tomorrow evening`, and `Choose time`. Per-category suggested delays can be introduced only after the basic loop works; they should be suggestions, never hidden automation.

The app should cap pending prompts and respect `Not now`, `Skip`, and `Stop asking about this category`. A missed check-in is simply missing data, not a failure.

## Relationship Between Logs, Categories, and Outcomes

- A **log** is the durable source record: raw text, event time, and context.
- One log may have several **categories**; categories are user-defined descriptions, not diagnoses or values.
- An **outcome check-in** belongs to one log and has a timing phase (`immediate` or `delayed`).
- One check-in contains one overall rating or an explicit `not sure` response.
- A category's trend is calculated from the check-ins of logs assigned to that category. If a log has several categories, it contributes to each relevant category view, with clear disclosure.

This model intentionally does not force the person to say which of several actions caused a feeling. The journal can show a co-occurrence; it cannot know whether alcohol, lack of sleep, a social conflict, or another unlogged factor was responsible.

## How Insights Should Work

The Trends area should be split into two concepts:

1. **Activity:** how often a category was logged, already supported by the app.
2. **Reported outcomes:** how people rated the immediate or delayed effect of logs in that category.

For a selected category and period, show:

- Number of logs.
- Number of completed check-ins and response rate.
- Distribution of overall answers: better, same, worse, and unsure.
- Average overall outcome only when enough completed, numeric responses exist.
- Separate immediate and delayed views; never combine them into one unexplained score.

Example wording:

> In 8 delayed check-ins connected to Alcohol during the last 90 days, you felt worse than before 5 times, about the same 2 times, and better once. Average overall effect: a little worse.

This should be framed as a personal observation, not a verdict:

- Say “was associated with,” “in your recorded check-ins,” and “you reported.”
- Do not say “caused,” “proves,” “is bad for you,” or “you should stop.”
- Always offer access to the original logs behind an insight.

## Evidence and Trust Rules

Insights can easily overstate small, biased samples. Apply these deterministic rules before surfacing a pattern:

- Require at least five completed numeric check-ins for a category, timing phase, and metric.
- Display the number of check-ins and date range alongside every result.
- Treat `Not sure`, skipped prompts, and unanswered prompts as missing; never convert them to zero.
- Do not rank categories as good or bad.
- Do not issue proactive advice from a correlation alone.
- Keep the raw entry and every check-in editable or deletable, and recompute trends immediately after a change.
- Let the person exclude a log from analysis without deleting its journal text.

Eventually the app can compare outcomes to a person's own baseline, but that requires enough data and careful explanations. The first release should use transparent counts and distributions rather than a black-box “impact score.”

## Recommended User Experience

### Capture

The existing composer stays focused on “What happened?” and category selection. After saving, present a lightweight choice:

- `Check in now`
- `Check in later`
- `Done`

Nothing should block saving a log. A person can also open any past log and add an outcome later.

### Check In

Add a dedicated **Check in** destination or a clearly visible home card for pending reflections. It should show one log excerpt, its date, the selected timing, the overall response, and an optional short note such as “What made it feel that way?”

The short note gives essential context without requiring a second journal entry. It also makes later pattern views explainable.

### Patterns

In a category's Trend view, add a toggle for `Activity` and `Outcomes`, then `Immediate` and `Later` when check-in data exists. Start with a simple 30- and 90-day range. A calendar/timeline can show events and their linked check-ins, but it should be a navigation surface rather than the only way to understand an insight.

## Proposed Data Model

Move from the current version-2 journal store to a new version that preserves all existing logs and categories, then adds these types conceptually:

```ts
type OutcomePhase = "immediate" | "delayed";
type OutcomeValue = -2 | -1 | 0 | 1 | 2;

type OutcomeStatus = "pending" | "answered" | "not_sure" | "skipped";

type OutcomeCheckIn = {
  id: string;
  entryId: string;
  phase: OutcomePhase;
  status: OutcomeStatus;
  dueAt: string | null;
  answeredAt: string | null;
  overall: OutcomeValue | null;
  note: string;
  excludedFromAnalysis: boolean;
  createdAt: string;
  updatedAt: string;
};
```

Important semantics:

- `dueAt` is present for a planned delayed check-in and absent for an immediate one.
- `status` distinguishes pending, answered, not-sure, and skipped check-ins. This makes notification behavior and analytics auditable.
- `answeredAt` records when the person answers or selects not-sure; it remains null for pending and skipped check-ins. Do not fabricate an outcome.
- `overall: null` means uncertainty or no response, not “about the same.”
- Archiving a category preserves its historical values and trends.

## Pull Request Plan

Each PR should be independently reviewable, preserve existing v2 journals, and include unit tests for its data behavior. The first four PRs deliver the complete local-only outcome loop. The remaining PRs improve its usefulness and can be scheduled separately.

### PR 1 — Outcome data foundation and v3 migration

**Goal:** Safely persist a single overall outcome check-in against an existing entry.

- Move the journal store from v2 to v3.
- Add `OutcomeCheckIn`, its five numeric values, `not_sure`, and explicit lifecycle statuses.
- Validate malformed outcome records and preserve a recoverable journal if data is unreadable.
- Migrate all existing v2 entries and categories without adding outcomes or changing their visible behavior.
- Add controller operations to create, answer, update, and remove a check-in; do not expose the UI yet.

**Acceptance:** Existing data loads unchanged; an answered, skipped, and not-sure check-in round-trip through local storage; invalid data is ignored safely; migration and controller tests pass.

### PR 2 — Immediate overall-feeling check-in

**Goal:** Let someone reflect on a log without making journal capture harder.

- Add a small `Check in now` action after a new log is saved and from the existing log detail screen.
- Build a focused check-in screen with the five labels, `Not sure / too soon to tell`, and optional note.
- Support correction or deletion from log detail.
- Make all actions accessible and make leaving the screen without an answer non-destructive.

**Acceptance:** A person can add, edit, mark not-sure, or remove an immediate outcome for both new and past logs. Saving a journal entry never requires an outcome.

### PR 3 — Delayed check-ins and the in-app queue

**Goal:** Capture consequences that emerge later without notifications or a backend.

- From a saved log, offer `Check in later` with explicit presets: later today, tomorrow morning, tomorrow evening, or a chosen time.
- Add a Check in tab or home card showing due and overdue local check-ins.
- Allow `Answer`, `Not sure`, `Skip`, and rescheduling; avoid any guilt-oriented copy.
- Determine due status entirely on-device from `dueAt` and current local time.

**Acceptance:** A scheduled reflection survives app restart, appears when due, can be rescheduled or skipped, and does not require notification permissions.

### PR 4 — Evidence-backed outcome trends

**Goal:** Turn completed check-ins into transparent category-level reflection.

- Add an `Outcomes` view beside existing activity trends.
- Filter by category, 30/90-day period, and immediate versus delayed phase.
- Calculate better/same/worse distribution, response count, response rate, and average numeric outcome.
- Gate interpretations behind at least five numeric check-ins and link every result to its source logs.
- Use neutral, non-causal language throughout.

**Acceptance:** Trends exclude skipped, not-sure, and analysis-excluded outcomes; sample size is always visible; a person can open the contributing logs from an insight.

### PR 5 — Outcome-aware timeline, search, and filters

**Goal:** Make it easy to find the context behind a pattern.

- Add date, category, pending-check-in, and outcome-direction filters to journal history.
- Add a chronological timeline/calendar that marks logs with a pending, answered, skipped, or not-sure reflection.
- Preserve a simple journal reading experience when no filters are active.

**Acceptance:** Users can move from an insight to its source logs and filter to, for example, delayed check-ins where they felt worse, without hiding entries that lack outcomes by default.

### PR 6 — Optional local reminders and controls

**Goal:** Make delayed reflections discoverable while retaining complete user control.

- Add optional local-device notifications for due check-ins; a backend is not needed.
- Add reminder settings, category-specific opt-out, quiet hours, and a cap on outstanding prompts.
- Make notification permission denial fully non-blocking; the in-app queue remains the source of truth.

**Acceptance:** No notification is scheduled without opt-in, opting out stops future prompts, and pending reflections remain usable entirely in-app.

### Deferred experiment — User-chosen outcome dimensions

Only consider this after the overall measure, delayed check-ins, and outcome trends are established. It would be a separate proposal and PR series, justified by a concrete need rather than added as a default checklist.

## Implementation Order

Implement PRs 1 through 4 in order. PR 5 and PR 6 can follow in either order. AI proposals and user-chosen dimensions remain out of scope until this deterministic, single-score loop is solid.

## Decisions to Carry Forward

- The product measures **reported effects**, not a universal health or morality score.
- The primary input is a five-point overall better-to-worse comparison, with an explicit uncertainty option.
- Outcomes are attached to individual episodes and may be immediate or delayed.
- The initial product has no default dimensions: it captures only one optional overall response.
- Patterns must show their sample size, stay neutral about causality, and lead back to the source logs.
- A log without an outcome remains a valid journal entry.
