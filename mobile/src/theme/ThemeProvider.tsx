import * as SecureStore from 'expo-secure-store';
import * as SystemUI from 'expo-system-ui';
import { colorScheme, useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_KEY = 'archer_theme';

/** Matches the `bg-slate-50` / `bg-slate-900` screen backgrounds. */
const BACKGROUND: Record<ResolvedTheme, string> = {
  light: '#f8fafc',
  dark: '#0f172a',
};

interface ThemeContextValue {
  /** The user's choice, including "system". */
  mode: ThemeMode;
  /** The scheme actually in effect ('system' resolved against the device). */
  resolved: ResolvedTheme;
  isDark: boolean;
  /** Screen background for the resolved scheme (used by native navigators). */
  background: string;
  setMode: (mode: ThemeMode) => void;
  /** Flips between light and dark, ignoring "system". */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * `colorScheme.set` drives both NativeWind's `dark:` variants and the native
 * appearance (alerts, keyboards, status bar), so one call keeps everything in
 * sync. "system" hands control back to the device.
 */
function applyTheme(mode: ThemeMode) {
  colorScheme.set(mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme: activeScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(THEME_KEY)
      .then((stored) => {
        if (!active) return;
        const next = isThemeMode(stored) ? stored : 'system';
        applyTheme(next);
        setModeState(next);
      })
      .catch(() => {})
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  const resolved: ResolvedTheme = mode === 'system' ? (activeScheme === 'dark' ? 'dark' : 'light') : mode;
  const background = BACKGROUND[resolved];

  useEffect(() => {
    if (__DEV__) console.log(`[theme/${Platform.OS}] mode=${mode} resolved=${resolved}`);
  }, [mode, resolved]);

  useEffect(() => {
    // Keeps the root window (behind screen transitions) from flashing white.
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(background).catch(() => {});
    }
  }, [background]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    applyTheme(next);
    SecureStore.setItemAsync(THEME_KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  }, [resolved, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, isDark: resolved === 'dark', background, setMode, toggle }),
    [mode, resolved, background, setMode, toggle],
  );

  // Avoid a light flash when the stored preference is dark.
  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
