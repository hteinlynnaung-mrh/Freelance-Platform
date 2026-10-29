import React, { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<React.ComponentRef<typeof TextInput>, InputProps>(({ label, error, hint, ...rest }, ref) => (
  <View className="gap-1">
    {label && <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Text>}
    <TextInput
      ref={ref}
      className={`bg-slate-50 dark:bg-slate-700 border ${
        error ? 'border-red-400' : 'border-slate-200 dark:border-slate-600'
      } rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-base`}
      placeholderTextColor="#94a3b8"
      {...rest}
    />
    {error && <Text className="text-xs text-red-500">{error}</Text>}
    {hint && !error && <Text className="text-xs text-slate-400">{hint}</Text>}
  </View>
));
Input.displayName = 'Input';
