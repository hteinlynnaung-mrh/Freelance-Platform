import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Port the local API listens on (see api/README.md). */
const DEFAULT_API_PORT = 5001;

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/** Tunnel dev servers (`expo start --tunnel`) proxy Metro only, not the API. */
const TUNNEL_HOSTNAME_SUFFIX = '.exp.direct';

/**
 * Host name of the Metro dev server that served this bundle, e.g. `192.168.1.24`
 * for `192.168.1.24:8081`. Expo Go provides it; production builds do not.
 */
function devServerHostname(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null | undefined)?.debuggerHost ??
    null;
  if (!hostUri) return null;

  const hostname = hostUri
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/:\d+$/, '')
    .replace(/^\[(.*)\]$/, '$1')
    .trim();
  return hostname || null;
}

/**
 * The Android emulator shares the host's loopback through the fixed alias
 * `10.0.2.2`, so it never needs `localhost` or `adb reverse` for the API.
 * Google's AVD images report an `sdk_gphone*` model and a `test-keys`/generic
 * fingerprint; other emulators (Genymotion, VirtualBox-based) keep `generic`,
 * `vbox`, or `unknown` in the fingerprint.
 */
function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;

  const { Brand, Fingerprint, Manufacturer, Model } = Platform.constants;
  return (
    /generic|unknown|vbox|emulator|test-keys|sdk_gphone/i.test(Fingerprint) ||
    /sdk_gphone|emulator|android sdk built for|bluestacks|genymotion/i.test(Model) ||
    /generic/i.test(Brand) ||
    /generic/i.test(Manufacturer)
  );
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Resolves the API base URL for the current runtime.
 *
 * 1. `EXPO_PUBLIC_API_URL` (or `expo.extra.apiUrl`) wins when set — use it for a
 *    deployed API, a tunnel dev server, or any host other than the Metro machine.
 * 2. The Android emulator uses `10.0.2.2`, its alias for the host machine's
 *    loopback. This works even when the host firewall blocks LAN traffic.
 * 3. Otherwise reuse the Metro dev-server host, so a physical device (and the
 *    iOS Simulator, which shares the Mac's network stack) reaches the API at the
 *    machine's LAN IP with no configuration. When Metro itself runs on
 *    `localhost`, fall back to `localhost`.
 */
export function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return stripTrailingSlash(configured);

  const extraUrl = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (extraUrl) return stripTrailingSlash(extraUrl);

  if (isAndroidEmulator()) {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  }

  const hostname = devServerHostname();
  const isTunnel = hostname?.toLowerCase().endsWith(TUNNEL_HOSTNAME_SUFFIX) ?? false;
  if (hostname && !isTunnel && !LOOPBACK_HOSTNAMES.has(hostname.toLowerCase())) {
    return `http://${hostname}:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_URL = resolveApiUrl();

if (__DEV__) {
  // Helpful when debugging "network request failed" on a device or emulator.
  console.log(`[api] base URL: ${API_URL}`);
  if (API_URL.includes(TUNNEL_HOSTNAME_SUFFIX)) {
    console.warn('[api] tunnel dev servers do not proxy the API; set EXPO_PUBLIC_API_URL to a reachable API host.');
  }
}
