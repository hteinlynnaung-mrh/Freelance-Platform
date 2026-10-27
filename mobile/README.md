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
# Edit .env and set EXPO_PUBLIC_API_URL to your API address
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

**Physical device**: set `EXPO_PUBLIC_API_URL=http://<your-machine-LAN-IP>:5001` in `.env`.

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
| `EXPO_PUBLIC_API_URL` | Base URL of the Archer API | `http://localhost:5001` |
