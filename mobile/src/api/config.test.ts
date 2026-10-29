import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
    expoGoConfig: null,
  },
}));

vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    constants: {
      Brand: 'Apple',
      Fingerprint: '',
      Manufacturer: 'Apple',
      Model: 'iPhone',
    },
  },
}));

describe('resolveApiUrl API endpoint resolution', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.EXPO_PUBLIC_API_URL = originalEnv;
    } else {
      delete process.env.EXPO_PUBLIC_API_URL;
    }
    vi.restoreAllMocks();
  });

  it('prioritizes EXPO_PUBLIC_API_URL when set', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.production.example.com/';
    const { resolveApiUrl } = await import('./config');
    expect(resolveApiUrl()).toBe('http://api.production.example.com');
  });

  it('falls back to localhost:5001 by default on iOS / simulator', async () => {
    const { resolveApiUrl } = await import('./config');
    expect(resolveApiUrl()).toBe('http://localhost:5001');
  });

  it('uses 10.0.2.2:5001 on Android emulator', async () => {
    const { Platform } = await import('react-native');
    Platform.OS = 'android';
    const constants = Platform.constants as Record<string, any>;
    constants.Fingerprint = 'google/sdk_gphone64_arm64/emu64a:14/UE1A.230829.036/11269094:userdebug/dev-keys';
    constants.Model = 'sdk_gphone64_arm64';

    const { resolveApiUrl } = await import('./config');
    expect(resolveApiUrl()).toBe('http://10.0.2.2:5001');
  });

  it('resolves Metro host LAN IP on physical device', async () => {
    const Constants = (await import('expo-constants')).default;
    (Constants as { expoConfig?: { hostUri?: string } }).expoConfig = { hostUri: '192.168.1.150:8081' };

    const { Platform } = await import('react-native');
    Platform.OS = 'ios';
    const constants = Platform.constants as Record<string, any>;
    constants.Model = 'iPhone';

    const { resolveApiUrl } = await import('./config');
    expect(resolveApiUrl()).toBe('http://192.168.1.150:5001');
  });
});
