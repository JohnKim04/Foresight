# Foresight

Foresight is a private mobile journal for free-form life logs. The current MVP is an Expo/React Native app for iOS and Android. It intentionally focuses on writing, saving, revisiting, and editing plain-text entries.

## Run locally

```sh
npm install
npm start
```

Use Expo Go or an iOS/Android simulator to open the app. The current MVP does not need an account, backend, or environment variables.

## Verify

```sh
npm run verify
```

## Build for release

The Expo configuration includes stable iOS and Android application identifiers and production EAS settings. After connecting the project to an Expo account and configuring store credentials, create production builds with:

```sh
npx eas-cli build --platform all --profile production
```

## Planning

[docs/mvp-plan.md](docs/mvp-plan.md) is the current source of truth. It links the implementation notes for the mobile data model, UI, and verification work. Linear is updated only when explicitly requested.
