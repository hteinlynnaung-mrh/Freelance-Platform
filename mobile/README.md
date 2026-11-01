# Archer Mobile

Expo React Native mobile application for the Archer freelance platform.

## Overview

Archer Mobile is an iOS and Android client built with Expo, React Native, and TypeScript. It consumes the same `/api/v1` REST contract as the web client, supporting project browsing, client and freelancer workflows, proposals, light/dark appearance, and English/Japanese localization.

## Technology Stack

- **Framework**: Expo SDK 58 (Expo Router)
- **Runtime**: React Native 0.88 + React 19
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Data Fetching**: TanStack React Query v5
- **Token Storage**: `expo-secure-store`
- **Testing**: Vitest

## Directory Structure

```
mobile/
├── app/                  # Expo Router file-based screens and tabs
├── src/
│   ├── api/              # HTTP client, dynamic host resolution, React Query hooks
│   ├── auth/             # AuthContext, secure store token management
│   ├── components/       # Shared UI primitives, cards, badges
│   ├── i18n/             # Translations (en/ja) and I18nProvider
│   └── theme/            # ThemeProvider (Light / Dark / System)
├── app.json              # Expo application configuration
├── package.json
└── tailwind.config.js
```

## Screens

File-based routes under `app/`:

| Route | Behavior |
|---|---|
| `index.tsx` | Auth-gated redirect to the tabs or the sign-in stack |
| `(auth)/login`, `(auth)/register` | Sign-in and registration |
| `(tabs)/index` | Home overview: active engagements, recent proposals, notification count |
| `(tabs)/projects` (`index`, `[id]`) | Project list with save toggle; detail with apply (proposal submission) |
| `(tabs)/freelancers` (`index`, `[id]`) | Freelancer directory and detail (hidden for FREELANCER accounts) |
| `(tabs)/proposals` (`index`, `[id]`) | Proposal list/detail; submit, withdraw, and client shortlist/reject/accept |
| `(tabs)/engagements` (`index`, `[id]`) | Engagement list/detail; submit for review, complete, cancel |
| `(tabs)/messages` (`index`, `[id]`) | Conversation list and message thread with send |
| `(tabs)/profile` | Profile editing, language switch, Light/Dark/System appearance, sign-out, delete account |
| `notifications` | Notification list with mark-as-read (modal) |

Not yet built: a review screen (API routes and en/ja review strings already exist) and client project creation/editing.

## Local Setup

### Requirements

- Node.js 20+ (Node 24 recommended)
- npm
- Expo Go on iOS / Android or an iOS Simulator / Android Emulator

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env
# .env can remain empty — the API host is automatically resolved at runtime!

# 3. Start development server
npm run dev
```

Scan the QR code with Expo Go or press `i` for iOS Simulator or `a` for Android Emulator.

## Dynamic API Host Resolution

`src/api/config.ts` dynamically resolves the backend API host based on the runtime environment:

| Runtime Target | Resolved Base URL | Behavior |
|---|---|---|
| **iOS Simulator / Web** | `http://localhost:5001` | Shares the host machine's loopback interface |
| **Android Emulator** | `http://10.0.2.2:5001` | Maps to the host machine's loopback automatically |
| **Physical Device (Expo Go)** | `http://<LAN-IP>:5001` | Derived from the Metro bundler host IP on the same Wi-Fi |

*Note: You only need to set `EXPO_PUBLIC_API_URL` if you are connecting to a remote staging server or non-Metro machine.*

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `expo start` | Start Metro development server |
| `npm run ios` | `expo start --ios` | Launch app on iOS Simulator |
| `npm run android` | `expo start --android` | Launch app on Android Emulator |
| `npm run typecheck` | `tsc --noEmit` | Check TypeScript types |
| `npm run build` | `expo export` | Export static production bundle |
| `npm run lint` | `eslint .` | Lint codebase |
| `npm test` | `vitest run` | Run mobile unit tests |

## Testing

Testing is powered by Vitest, testing runtime API host resolution and translation dictionary parity:

```bash
npm test
```

### Test Suites

- `src/api/config.test.ts`: Verifies dynamic API base URL resolution across environments (`EXPO_PUBLIC_API_URL` override, iOS Simulator loopback, Android emulator `10.0.2.2:5001`, and physical device Metro LAN IP).
- `src/i18n/translations.test.ts`: Verifies complete translation key parity between English (`en`) and Japanese (`ja`).
## Key Features & Conventions

- **Secure Storage**: Access and refresh tokens are securely stored in `expo-secure-store` and never logged.
- **Auto Refresh**: Automatic token refresh handling keeps user sessions active.
- **Theming**: Supports Light, Dark, and System appearance preferences, styled via NativeWind with paired light/dark classes.
- **Currencies**: Displays `USD` and `JPY` amounts formatted according to platform standards (integer minor units, whole yen with no decimals for JPY).
