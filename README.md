# Foresight

Foresight is a private, local-first mobile journal for iOS and Android. It supports free-form logs, optional categories, immediate or delayed overall-feeling check-ins, and evidence-backed outcome trends.

## Local development quickstart

Install dependencies, then start Expo:

```sh
npm install
npm start
```

Open the app in Expo Go by scanning the terminal QR code, or launch a simulator directly:

```sh
npm run ios
npm run android
```

No account, backend, environment variables, or notification permission is required for local development. Journal data is kept in the device or simulator's local app storage.

## Check-in flow

1. Create and save a log, optionally assigning one or more categories.
2. From the saved log, choose `Check in now` to record an overall response from “Much worse” to “Much better,” or select `Not sure`.
3. Choose `Check in later` to schedule a private follow-up for later today, tomorrow morning/evening, or a custom date and time.
4. Open the `Check in` tab to answer due or overdue reflections, reschedule them, or skip them. These are in-app prompts only; the app does not schedule operating-system notifications yet.
5. In `Trends`, choose `Outcomes`, select a category, a 30- or 90-day range, and `Right after` or `Later`. Foresight shows counts immediately and writes a neutral summary only after five numeric responses. Tap a source log to review its context.

## Verify

```sh
npm run verify
```

This runs all local gates in order:

- `npm run check` — TypeScript validation
- `npm test` — storage, navigation, check-in queue, and outcome-trend tests
- `npm run doctor` — Expo configuration validation
- `npm run bundle` — iOS and Android JavaScript bundle generation

## Build for release

The Expo configuration includes stable iOS and Android application identifiers and production EAS settings. After connecting the project to an Expo account and configuring store credentials, create production builds with:

```sh
npx eas-cli build --platform all --profile production
```

## Planning

[docs/mvp-plan.md](docs/mvp-plan.md) is the current source of truth. It links the implementation notes for the mobile data model, UI, and verification work. Linear is updated only when explicitly requested.
