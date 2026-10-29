import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';
import { useMyProfile, useUpdateMyProfile } from '../../src/api/hooks/useProfiles';
import { Avatar } from '../../src/components/shared/Avatar';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { useI18n } from '../../src/i18n/I18nProvider';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, isJapanese } = useI18n();
  const router = useRouter();
  const { data, isLoading } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');

  const profile = data?.data;
  const fp = profile?.freelancerProfile;
  const cp = profile?.clientProfile;

  useEffect(() => {
    if (fp) { setDisplayName(fp.displayName ?? ''); setBio(fp.bio ?? ''); setHeadline(fp.headline ?? ''); setLocation(fp.location ?? ''); }
    else if (cp) { setDisplayName(cp.displayName ?? ''); setBio(cp.bio ?? ''); setLocation(cp.location ?? ''); }
  }, [fp, cp]);

  const handleSave = async () => {
    try {
      const data: Record<string, string> = { displayName, bio, location };
      if (fp) data.headline = headline;
      await updateProfile.mutateAsync(data);
      setEditing(false);
    } catch (e: any) { Alert.alert(e?.message ?? t('somethingWentWrong')); }
  };

  const handleLogout = () => {
    Alert.alert(t('signOut'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('signOut'), style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  const name = fp?.displayName ?? cp?.displayName ?? user?.email ?? '';
  const avatarUrl = fp?.avatarUrl ?? cp?.avatarUrl;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-slate-900 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('profile')}</Text>
        <Pressable onPress={() => setEditing(!editing)} className="active:opacity-60">
          <Text className="text-indigo-600 font-medium">{editing ? t('cancel') : t('editProfile')}</Text>
        </Pressable>
      </View>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerClassName="p-4 gap-5" keyboardShouldPersistTaps="handled">
          {/* Avatar + name */}
          <View className="items-center gap-3">
            <Avatar uri={avatarUrl} name={name} size="xl" />
            <View className="items-center gap-1">
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{name}</Text>
              <Badge label={user?.role ?? ''} color="indigo" />
              <Text className="text-sm text-slate-400">{user?.email}</Text>
            </View>
          </View>

          {editing ? (
            <View className="gap-4">
              <Input label={t('fullName')} value={displayName} onChangeText={setDisplayName} />
              {fp && <Input label={t('headline')} value={headline} onChangeText={setHeadline} />}
              <Input label={t('bio')} value={bio} onChangeText={setBio} multiline numberOfLines={4} />
              <Input label={t('location')} value={location} onChangeText={setLocation} />
              <Button label={t('saveChanges')} onPress={handleSave} loading={updateProfile.isPending} />
            </View>
          ) : (
            <View className="gap-4">
              {fp?.headline && (
                <View className="gap-1">
                  <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('headline')}</Text>
                  <Text className={`text-slate-700 dark:text-slate-300 ${isJapanese ? 'leading-relaxed' : ''}`}>{fp.headline}</Text>
                </View>
              )}
              {(fp?.bio ?? cp?.bio) && (
                <View className="gap-1">
                  <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('bio')}</Text>
                  <Text className={`text-slate-700 dark:text-slate-300 leading-relaxed`}>{fp?.bio ?? cp?.bio}</Text>
                </View>
              )}
              {fp?.skills && fp.skills.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('skills')}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {fp.skills.map((s: { skill: { id: string; name: string } }) => <Badge key={s.skill.id} label={s.skill.name} />)}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Language toggle */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 gap-3">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('language')}</Text>
            <View className="flex-row gap-3">
              {(['en', 'ja'] as const).map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  className={`flex-1 rounded-xl border py-3 items-center ${
                    language === lang
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Text className={language === lang ? 'text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                    {lang === 'en' ? t('english') : t('japanese')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Appearance toggle */}
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-4 gap-3">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('appearance')}</Text>
            <ThemeToggle />
          </View>

          {/* Sign out */}
          <Button label={t('signOut')} variant="danger" onPress={handleLogout} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
