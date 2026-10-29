# Archer Mobile

Expo React Native app for the Archer freelance platform.

## Requirements

- Node.js 20+
- npm
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- Expo Go on your device (for physical device testing)

## Setup

```bash
cd mobile
npm install
cp .env.example .env
# .env can stay empty — the API host is detected automatically
```

## Local development

Start the API first:
```bash
npm --prefix api run dev   # API on port 5001
```

Then start the mobile app:
```bash
npm run dev
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` for simulator.

### How the app finds the API

`src/api/config.ts` resolves the base URL at runtime, because "localhost" means something
different on each target:

| Target | Resolved base URL | Why |
|---|---|---|
| iOS Simulator / web | `http://localhost:5001` | shares the host's loopback interface |
| Android emulator | `http://10.0.2.2:5001` | inside the emulator, `127.0.0.1` is the emulated device; `10.0.2.2` is your machine |
| Physical device | `http://<machine-LAN-IP>:5001` | taken from the Metro dev-server host, so it works on the same Wi-Fi with no edits |

Resolution order: `EXPO_PUBLIC_API_URL` from `.env` (if non-empty) → `expo.extra.apiUrl` in
`app.json` → the Metro dev-server host → platform fallback. No `adb reverse` for port
5001 is needed; Expo still forwards Metro's own port.

Set `EXPO_PUBLIC_API_URL` only when the API is not running on the machine hosting Metro:

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5001   # remote API or tunnel dev server
```

**Android emulator note**: if you *do* pin `EXPO_PUBLIC_API_URL=http://localhost:5001`, the
emulator cannot reach your machine's loopback, so forward the port manually:

```bash
adb reverse tcp:5001 tcp:5001
```

Opening the project in Expo Go on the emulator:

```bash
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"
```

**Expo Go version**: this project targets Expo SDK 58, so use an Expo Go 58 client. The app stores
normally ship the current SDK, but if your installed Expo Go is older, grab the matching build
([iOS simulator tarball](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-58.0.7),
[Android APK](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-58.0.5)) or use a development build.

Installing the iOS simulator build by hand (the tarball is a flat `.app` bundle, not a folder):

```bash
tar -xzf Expo-Go-58.0.7.tar.gz -C /tmp/expogo58x
mkdir -p "/tmp/ExpoGo58" && ditto /tmp/expogo58x "/tmp/ExpoGo58/Expo Go.app"
xcrun simctl install booted "/tmp/ExpoGo58/Expo Go.app"
xcrun simctl openurl booted "exp://127.0.0.1:8081"
```

Android: `adb install -r Expo-Go-58.0.5.apk`, then the `am start` command above.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Expo dev server |
| `npm run ios` | Open in iOS Simulator |
| `npm run android` | Open in Android emulator |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Export static bundle |

## Demo accounts

See `api/README.md` for seeded demo credentials.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Archer API (empty = auto-detect from the dev server) | auto: `localhost:5001` (iOS/web), `10.0.2.2:5001` (Android emulator) |

## Light and dark mode

Appearance is a three-way switch: **Light / Dark / System**. It lives in the Profile tab
(`Appearance` card) and as a compact moon/sun button on the sign-in screen.

- `src/theme/ThemeProvider.tsx` persists the choice in SecureStore (`archer_theme`), calls
  NativeWind's `colorScheme.set(mode)` so `dark:` classes and native surfaces (alerts,
  keyboards, status bar) change together, and follows the device in System mode. The
  Android window background is kept in sync with `expo-system-ui` so screen transitions
  do not flash white.
- `src/components/ui/ThemeToggle.tsx` holds the segmented control and the icon button.
- Screens pair an explicit background with a dark variant (`bg-white dark:bg-slate-900`,
  `text-slate-900 dark:text-slate-100`); the tab bar colours come from `useTheme()`.

To preview System mode against the OS, flip the device appearance: iOS Simulator
`xcrun simctl ui booted appearance dark|light`, Android Settings > Display > Dark theme.
