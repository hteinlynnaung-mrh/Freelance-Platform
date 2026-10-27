import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';
import { useEngagements } from '../../src/api/hooks/useEngagements';
import { useProposals } from '../../src/api/hooks/useProposals';
import { useNotifications } from '../../src/api/hooks/useNotifications';
import { EngagementCard } from '../../src/components/shared/EngagementCard';
import { ProposalCard } from '../../src/components/shared/ProposalCard';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { useI18n } from '../../src/i18n/I18nProvider';
import { Button } from '../../src/components/ui/Button';
import { ArcherMark } from '../../src/components/shared/ArcherMark';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const { data: engData, isLoading: loadEng } = useEngagements();
  const { data: propData, isLoading: loadProp } = useProposals();
  const { data: notifData } = useNotifications();

  const engagements = (engData?.data ?? []).filter((e) => e.status === 'ACTIVE').slice(0, 3);
  const proposals = (propData?.data ?? []).slice(0, 3);
  const unreadCount = (notifData?.data ?? []).filter((n) => !n.readAt).length;

  const displayName = user?.clientProfile?.displayName ?? user?.freelancerProfile?.displayName ?? user?.email ?? '';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <ArcherMark size={30} />
            <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">Archer</Text>
          </View>
          <Text className="text-slate-500 dark:text-slate-400 text-sm">Hi, {displayName.split(' ')[0]}</Text>
        </View>
        <View className="flex-row gap-3 items-center">
          {unreadCount > 0 && (
            <View className="bg-indigo-600 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
          <Button label="🔔" variant="ghost" size="sm" onPress={() => router.push('/notifications')} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-6">
        {/* Active Engagements */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('activeEngagements')}</Text>
            <Button label="See all" variant="ghost" size="sm" onPress={() => router.push('/(tabs)/engagements')} />
          </View>
          {loadEng ? <LoadingSpinner size="small" /> : engagements.length === 0 ? (
            <Text className="text-slate-400 text-sm">{t('noEngagements')}</Text>
          ) : engagements.map((e) => <EngagementCard key={e.id} engagement={e} />)}
        </View>

        {/* Recent Proposals */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('recentProposals')}</Text>
            <Button label="See all" variant="ghost" size="sm" onPress={() => router.push('/(tabs)/proposals')} />
          </View>
          {loadProp ? <LoadingSpinner size="small" /> : proposals.length === 0 ? (
            <Text className="text-slate-400 text-sm">{t('noProposals')}</Text>
          ) : proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)}
        </View>

        {/* Quick links */}
        <View className="gap-2">
          <Button label={t('browseProjects')} onPress={() => router.push('/(tabs)/projects')} variant="secondary" />
          {user?.role === 'CLIENT' && (
            <Button label={t('findTalent')} onPress={() => router.push('/(tabs)/freelancers')} variant="secondary" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
