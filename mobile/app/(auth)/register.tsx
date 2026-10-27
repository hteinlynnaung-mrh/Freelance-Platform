import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { ArcherMark } from '../../src/components/shared/ArcherMark';
import { useI18n } from '../../src/i18n/I18nProvider';

type Role = 'CLIENT' | 'FREELANCER';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t, isJapanese } = useI18n();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('FREELANCER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!displayName.trim() || !email.trim() || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(email.trim(), password, role, displayName.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-white dark:bg-slate-900" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerClassName="flex-grow px-6 py-12 justify-center gap-6" keyboardShouldPersistTaps="handled">
        <View className="items-center gap-2 mb-4">
          <ArcherMark size={58} />
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">Archer</Text>
          <Text className={`text-slate-500 dark:text-slate-400 text-center ${isJapanese ? 'leading-relaxed' : ''}`}>
            {t('createYourAccount')}
          </Text>
        </View>

        {/* Role picker */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('chooseRole')}</Text>
          <View className="flex-row gap-3">
            {(['FREELANCER', 'CLIENT'] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 rounded-xl border p-4 ${
                  role === r
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <Text className={`font-semibold text-center ${role === r ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {t(r === 'CLIENT' ? 'clientRole' : 'freelancerRole')}
                </Text>
                <Text className={`text-xs text-center mt-1 ${isJapanese ? 'leading-relaxed' : ''} ${role === r ? 'text-indigo-500' : 'text-slate-400'}`}>
                  {t(r === 'CLIENT' ? 'clientRoleCopy' : 'freelancerRoleCopy')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Input label={t('fullName')} placeholder="Jane Smith" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" textContentType="name" />
          <Input label={t('emailAddress')} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" textContentType="emailAddress" />
          <Input label={t('password')} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" error={error || undefined} hint="At least 8 characters" />
        </View>

        <Button label={t('createAccount')} onPress={handleRegister} loading={loading} />

        <View className="flex-row justify-center gap-1">
          <Text className="text-slate-500 dark:text-slate-400">{t('alreadyHaveAccount')}</Text>
          <Link href="/(auth)/login" asChild>
            <Text className="text-indigo-600 font-medium">{t('signIn')}</Text>
          </Link>
        </View>

                <Text className={`text-xs text-slate-400 text-center ${isJapanese ? 'leading-relaxed' : ''}`}>{t('termsCopy')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
