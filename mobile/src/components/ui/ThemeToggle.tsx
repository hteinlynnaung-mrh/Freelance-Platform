import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/translations';
import { useTheme, type ThemeMode } from '../../theme/ThemeProvider';

interface ThemeOption {
  mode: ThemeMode;
  icon: string;
  labelKey: TranslationKey;
}

const OPTIONS: ThemeOption[] = [
  { mode: 'light', icon: '☀️', labelKey: 'themeLight' },
  { mode: 'dark', icon: '🌙', labelKey: 'themeDark' },
  { mode: 'system', icon: '📱', labelKey: 'themeSystem' },
];

/** Three-way appearance switch: Light / Dark / System. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();

  return (
    <View className="flex-row gap-2" accessibilityRole="radiogroup" accessibilityLabel={t('appearance')}>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => setMode(option.mode)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={t(option.labelKey)}
            className={`flex-1 items-center gap-1 rounded-xl border py-3 ${
              active
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <Text style={{ fontSize: 18 }}>{option.icon}</Text>
            <Text
              numberOfLines={1}
              className={`text-xs ${
                active ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t(option.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Compact icon button that flips between light and dark (used on auth screens). */
export function ThemeIconButton() {
  const { isDark, toggle } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={t('toggleTheme')}
      hitSlop={8}
      className="h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white active:opacity-70 dark:border-slate-700 dark:bg-slate-800"
    >
      <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
    </Pressable>
  );
}
