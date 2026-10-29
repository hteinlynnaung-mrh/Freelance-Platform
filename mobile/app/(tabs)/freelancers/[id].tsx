import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFreelancer } from '../../../src/api/hooks/useProfiles';
import { Avatar } from '../../../src/components/shared/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { CurrencyBadge } from '../../../src/components/shared/CurrencyBadge';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useI18n } from '../../../src/i18n/I18nProvider';

export default function FreelancerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { data, isLoading, error } = useFreelancer(id!);
  const profile = data?.data;

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (error || !profile) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader title="Freelancer" showBack />
      <ErrorBanner message={t('somethingWentWrong')} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
      <ScreenHeader title={profile.displayName} showBack />
      <ScrollView contentContainerClassName="p-4 gap-6">
        {/* Profile header */}
        <View className="flex-row gap-4 items-start">
          <Avatar uri={profile.avatarUrl} name={profile.displayName} size="xl" />
          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{profile.displayName}</Text>
            {profile.headline && <Text className="text-slate-500 dark:text-slate-400">{profile.headline}</Text>}
            {profile.location && <Text className="text-sm text-slate-400">📍 {profile.location}</Text>}
            {profile.hourlyRateMinor != null && profile.currency && (
              <CurrencyBadge amountMinor={profile.hourlyRateMinor} currency={profile.currency} type="HOURLY" />
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View className="gap-1">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('bio')}</Text>
            <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">{profile.bio}</Text>
          </View>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('skills')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {profile.skills.map((s) => <Badge key={s.skill.id} label={s.skill.name} />)}
            </View>
          </View>
        )}

        {/* Availability + experience */}
        {(profile.availability || profile.experienceLevel) && (
          <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 gap-3">
            {profile.availability && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-500 dark:text-slate-400">{t('availability')}</Text>
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{profile.availability}</Text>
              </View>
            )}
            {profile.experienceLevel && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-slate-500 dark:text-slate-400">{t('experienceLevel')}</Text>
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">{profile.experienceLevel}</Text>
              </View>
            )}
          </View>
        )}

        {/* Portfolio */}
        {profile.portfolioItems.length > 0 && (
          <View className="gap-3">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('portfolio')}</Text>
            {profile.portfolioItems.map((item) => (
              <View key={item.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 gap-1">
                <Text className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</Text>
                {item.description && <Text className="text-sm text-slate-500 dark:text-slate-400">{item.description}</Text>}
                {item.externalUrl && <Text className="text-sm text-indigo-500">{item.externalUrl}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
