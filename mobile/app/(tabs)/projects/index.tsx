import React, { useState } from 'react';
import { FlatList, Pressable, TextInput, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProjects, useSaveProject } from '../../../src/api/hooks/useProjects';
import { useCategories } from '../../../src/api/hooks/useReference';
import { ProjectCard } from '../../../src/components/shared/ProjectCard';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { Badge } from '../../../src/components/ui/Badge';
import { useI18n } from '../../../src/i18n/I18nProvider';

export default function ProjectsScreen() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [currency, setCurrency] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useProjects({
    q: query || undefined,
    categoryId: selectedCategory,
    currency,
    page,
  });
  const { data: catData } = useCategories();
  const saveProject = useSaveProject();

  const projects = data?.data ?? [];
  const categories = catData?.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Search bar */}
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-slate-900 gap-3">
        <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('allProjects')}</Text>
        <View className="flex-row items-center bg-slate-100 dark:bg-slate-700 rounded-xl px-3 gap-2">
          <Text className="text-slate-400 text-lg">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-slate-900 dark:text-slate-100 text-base"
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={(v) => { setQuery(v); setPage(1); }}
            returnKeyType="search"
          />
        </View>
        {/* Currency filter */}
        <View className="flex-row gap-2">
          {(['', 'USD', 'JPY'] as const).map((c) => (
            <Pressable key={c || 'all'} onPress={() => setCurrency(c || undefined)}>
              <Badge
                label={c || t('allCurrencies')}
                color={currency === c || (!c && !currency) ? 'indigo' : 'default'}
              />
            </Pressable>
          ))}
        </View>
        {/* Category chips */}
        {categories.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            <Pressable onPress={() => setSelectedCategory(undefined)}>
              <Badge
                label={t('allProjects')}
                color={!selectedCategory ? 'indigo' : 'default'}
              />
            </Pressable>
            {categories.slice(0, 8).map((cat) => (
              <Pressable key={cat.id} onPress={() => setSelectedCategory(cat.id)}>
                <Badge
                  label={cat.name}
                  color={selectedCategory === cat.id ? 'indigo' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {error && <ErrorBanner message={t('somethingWentWrong')} onRetry={refetch} retryLabel={t('retry')} />}

      {isLoading ? (
        <LoadingSpinner fullscreen label={t('loadingProject')} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 pt-3">
              <ProjectCard project={item} onSave={() => saveProject.mutate(item.id)} />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="📭" title={t('noProjects')} description={t('searchPlaceholder')} />
          }
          contentContainerClassName="pb-8"
        />
      )}
    </SafeAreaView>
  );
}
