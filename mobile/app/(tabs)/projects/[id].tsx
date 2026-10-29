import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProject, useSaveProject, useUnsaveProject } from '../../../src/api/hooks/useProjects';
import { useAuth } from '../../../src/auth/AuthContext';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { CurrencyBadge } from '../../../src/components/shared/CurrencyBadge';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useI18n } from '../../../src/i18n/I18nProvider';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useProject(id!);
  const saveProject = useSaveProject();
  const unsaveProject = useUnsaveProject();
  const [saved, setSaved] = useState(false);

  const project = data?.data;

  const handleSave = () => {
    if (saved) {
      unsaveProject.mutate(id!, { onSuccess: () => setSaved(false) });
    } else {
      saveProject.mutate(id!, { onSuccess: () => setSaved(true) });
    }
  };

  if (isLoading) return <LoadingSpinner fullscreen label={t('loadingProject')} />;
  if (error || !project) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader title={t('projectBrief')} showBack />
      <ErrorBanner message={error?.message ?? t('projectNotFound')} onRetry={refetch} retryLabel={t('retry')} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
      <ScreenHeader
        title={t('projectBrief')}
        showBack
        right={
          <Button label={saved ? '🔖' : '🔖'} variant="ghost" size="sm" onPress={handleSave} />
        }
      />
      <ScrollView contentContainerClassName="p-4 gap-6">
        {/* Title + category */}
        <View className="gap-2">
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project.title}</Text>
          {project.category && <Badge label={project.category.name} color="indigo" />}
        </View>

        {/* Budget */}
        <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 gap-2">
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('projectBudget')}</Text>
          <CurrencyBadge amountMinor={project.budgetMinor} currency={project.currency} type={project.budgetType} />
          <Text className="text-xs text-slate-400">{project.budgetType === 'FIXED' ? t('fixedPrice') : t('perHour')}</Text>
        </View>

        {/* Deadline */}
        {project.deadline && (
          <View className="flex-row items-center gap-2">
            <Text className="text-sm text-slate-500 dark:text-slate-400">{t('timeline')}:</Text>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {new Date(project.deadline).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Skills */}
        {project.skills.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('skills')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {project.skills.map((s) => <Badge key={s.skill.id} label={s.skill.name} />)}
            </View>
          </View>
        )}

        {/* Description */}
        <View className="gap-2">
          <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('aboutProject')}</Text>
          <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">{project.description}</Text>
        </View>

        {/* CTA */}
        {user?.role === 'FREELANCER' && (
          <View className="gap-3 mt-2">
            <Button
              label={t('applyProject')}
              onPress={() => router.push(`/(tabs)/proposals/${project.id}?action=submit`)}
            />
            <Text className="text-xs text-slate-400 text-center">{t('noPaymentCollected')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
