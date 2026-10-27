import React from 'react';
import { Text, View } from 'react-native';
import type { Currency } from '../../api/types';

interface CurrencyBadgeProps {
  amountMinor: number;
  currency: Currency;
  type?: 'FIXED' | 'HOURLY';
  compact?: boolean;
}

function formatMoney(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(major);
}

export function CurrencyBadge({ amountMinor, currency, type, compact }: CurrencyBadgeProps) {
  const label = formatMoney(amountMinor, currency);
  const suffix = type === 'HOURLY' ? '/hr' : type === 'FIXED' ? ' fixed' : '';
  return (
    <View className="flex-row items-center gap-1">
      <Text className={`font-semibold text-slate-900 dark:text-slate-100 ${compact ? 'text-sm' : 'text-base'}`}>{label}</Text>
      {suffix ? <Text className="text-slate-400 text-xs">{suffix}</Text> : null}
    </View>
  );
}

export { formatMoney };
