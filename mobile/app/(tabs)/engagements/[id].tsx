import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEngagement, useSubmitEngagement, useCompleteEngagement, useCancelEngagement } from '../../../src/api/hooks/useEngagements';
import { useAuth } from '../../../src/auth/AuthContext';
import { Avatar } from '../../../src/components/shared/Avatar';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { CurrencyBadge } from '../../../src/components/shared/CurrencyBadge';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useI18n } from '../../../src/i18n/I18nProvider';

const statusColor: Record<string, 'default' | 'green' | 'yellow' | 'red' | 'indigo' | 'blue'> = {
  ACTIVE: 'green', SUBMITTED_FOR_REVIEW: 'yellow', COMPLETED: 'indigo', CANCELLED: 'red',
};

export default function EngagementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error } = useEngagement(id!);
  const submit = useSubmitEngagement();
  const complete = useCompleteEngagement();
  const cancel = useCancelEngagement();

  const engagement = data?.data;

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (error || !engagement) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader title={t('engagements')} showBack />
      <ErrorBanner message={error?.message ?? t('somethingWentWrong')} />
    </SafeAreaView>
  );

  const isClient = user?.id === engagement.clientId;
  const isFreelancer = user?.id === engagement.freelancerId;
  const other = isClient
    ? engagement.freelancer.freelancerProfile?.displayName ?? engagement.freelancer.email
    : engagement.client.clientProfile?.displayName ?? engagement.client.email;
  const otherAvatar = isClient
    ? engagement.freelancer.freelancerProfile?.avatarUrl
    : engagement.client.clientProfile?.avatarUrl;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
      <ScreenHeader title={engagement.project.title} showBack />
      <ScrollView contentContainerClassName="p-4 gap-5">
        {/* Status */}
        <View className="flex-row items-center justify-between">
          <Badge label={engagement.status.replace(/_/g, ' ')} color={statusColor[engagement.status]} />
          {engagement.startDate && (
            <Text className="text-xs text-slate-400">Started {new Date(engagement.startDate).toLocaleDateString()}</Text>
          )}
        </View>

        {/* Counterpart */}
        <View className="flex-row items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
          <Avatar uri={otherAvatar} name={other} size="md" />
          <View>
            <Text className="text-xs text-slate-400">{isClient ? 'Freelancer' : 'Client'}</Text>
            <Text className="font-semibold text-slate-900 dark:text-slate-100">{other}</Text>
          </View>
        </View>

        {/* Budget */}
        <View className="gap-1">
          <Text className="text-sm text-slate-500 dark:text-slate-400">Budget</Text>
          <CurrencyBadge amountMinor={engagement.proposal.proposedAmountMinor} currency={engagement.proposal.currency} />
          {engagement.proposal.estimatedDurationDays && (
            <Text className="text-xs text-slate-400">{engagement.proposal.estimatedDurationDays} days</Text>
          )}
        </View>

        {/* Actions */}
        <View className="gap-3">
          {isFreelancer && engagement.status === 'ACTIVE' && (
            <Button label={t('submitForReview')} onPress={() => submit.mutate(id!, { onSuccess: () => router.back() })} loading={submit.isPending} />
          )}
          {isClient && engagement.status === 'SUBMITTED_FOR_REVIEW' && (
            <Button label={t('markComplete')} onPress={() => {
              Alert.alert('Mark complete?', '', [
                { text: t('cancel'), style: 'cancel' },
                { text: t('confirm'), onPress: () => complete.mutate(id!, { onSuccess: () => router.back() }) },
              ]);
            }} loading={complete.isPending} />
          )}
          {['ACTIVE', 'SUBMITTED_FOR_REVIEW'].includes(engagement.status) && (
            <Button label={t('cancelEngagement')} variant="danger" onPress={() => {
              Alert.alert('Cancel engagement?', 'This cannot be undone.', [
                { text: t('cancel'), style: 'cancel' },
                { text: 'Cancel engagement', style: 'destructive', onPress: () => cancel.mutate(id!, { onSuccess: () => router.back() }) },
              ]);
            }} loading={cancel.isPending} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
