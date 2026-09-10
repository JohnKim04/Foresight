# Chunk 3: Verification Checklist

## Automated checks

- Run `npm run check` to type-check application and test modules.
- Run `npm test` to exercise the entry lifecycle and AsyncStorage recovery.
- Run `npm run doctor` to validate Expo configuration and SDK dependency compatibility.
- Run `npm run bundle` to produce verified iOS and Android JavaScript bundles.
- Run `npm run verify` to execute all automated checks together.

## Manual local checks

1. Run `npm start` and open the app in Expo Go or an iOS/Android simulator.
2. Save a plain-text journal entry, including a corrected event time with the native picker.
3. Reload the app and confirm the entry remains in history.
4. Select the entry, enter edit mode, update its text, save, and refresh again.
5. Confirm the history remains newest-event-first and the displayed entry is updated.
6. Start from empty storage and confirm the empty-state guidance is useful.
7. Use only the keyboard to focus the compose controls, save, select an entry, enter edit mode, and cancel.

## Completion bar

The MVP is complete when the automated checks pass and the manual flow works against the local mobile application. The project is ready to create EAS production builds once an Expo account and store signing credentials are connected. Do not treat a static mock-up as completion: on-device storage, reload persistence, readable history, and editing must all be verified.
