import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProposals, useSubmitProposal, useWithdrawProposal, useShortlistProposal, useRejectProposal, useAcceptProposal } from '../../../src/api/hooks/useProposals';
import { useProject } from '../../../src/api/hooks/useProjects';
import { useAuth } from '../../../src/auth/AuthContext';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { CurrencyBadge } from '../../../src/components/shared/CurrencyBadge';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useI18n } from '../../../src/i18n/I18nProvider';

export default function ProposalDetailScreen() {
  const { id, action } = useLocalSearchParams<{ id: string; action?: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  // Submit mode (coming from project detail page)
  const isSubmitMode = action === 'submit';
  const [coverLetter, setCoverLetter] = useState('');
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState('');
  const submitProposal = useSubmitProposal(id!);
  const { data: projectData } = useProject(id!);
  const proposalCurrency = projectData?.data.currency ?? 'USD';

  const { data, isLoading, error } = useProposals();
  const proposal = isSubmitMode ? null : (data?.data ?? []).find((p) => p.id === id);

  const withdraw = useWithdrawProposal();
  const shortlist = useShortlistProposal();
  const reject = useRejectProposal();
  const accept = useAcceptProposal();

  const handleSubmit = async () => {
    if (!coverLetter.trim() || !amount) { Alert.alert('Please fill in all fields.'); return; }
    try {
      await submitProposal.mutateAsync({ coverLetter, proposedAmountMinor: Math.round(parseFloat(amount) * 100), currency: proposalCurrency, estimatedDurationDays: days ? parseInt(days) : undefined });
      Alert.alert('Proposal submitted!', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert(e?.message ?? t('somethingWentWrong')); }
  };

  if (isSubmitMode) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
        <ScreenHeader title={t('submitProposal')} showBack />
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
            <Input label={t('coverLetter')} value={coverLetter} onChangeText={setCoverLetter} multiline numberOfLines={6} placeholder="Describe your approach and relevant experience…" />
            <Input label={`${t('proposedAmount')} (${proposalCurrency}, e.g. 1500)`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="1500" />
            <Input label={t('estimatedDuration')} value={days} onChangeText={setDays} keyboardType="number-pad" placeholder="30" />
            <Button label={t('submitProposal')} onPress={handleSubmit} loading={submitProposal.isPending} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (error || !proposal) return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <ScreenHeader title={t('proposals')} showBack />
      <ErrorBanner message={error?.message ?? t('somethingWentWrong')} />
    </SafeAreaView>
  );

  const isFreelancer = user?.role === 'FREELANCER';
  const isClient = user?.role === 'CLIENT';
  const canWithdraw = isFreelancer && ['SUBMITTED', 'SHORTLISTED'].includes(proposal.status);
  const canAction = isClient && ['SUBMITTED', 'SHORTLISTED'].includes(proposal.status);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
      <ScreenHeader title={t('proposals')} showBack />
      <ScrollView contentContainerClassName="p-4 gap-5">
        <View className="gap-2">
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">{proposal.project.title}</Text>
          <Badge label={proposal.status} color={proposal.status === 'ACCEPTED' ? 'green' : proposal.status === 'REJECTED' ? 'red' : 'indigo'} />
        </View>
        <CurrencyBadge amountMinor={proposal.proposedAmountMinor} currency={proposal.currency} />
        {proposal.estimatedDurationDays && <Text className="text-sm text-slate-500">{proposal.estimatedDurationDays} days</Text>}
        <View className="gap-1">
          <Text className="text-sm font-medium text-slate-500">{t('coverLetter')}</Text>
          <Text className="text-slate-700 dark:text-slate-300 leading-relaxed">{proposal.coverLetter}</Text>
        </View>
        {canWithdraw && (
          <Button label={t('withdrawProposal')} variant="danger" onPress={() => {
            Alert.alert('Withdraw proposal?', '', [
              { text: t('cancel'), style: 'cancel' },
              { text: t('confirm'), onPress: () => withdraw.mutate(proposal.id, { onSuccess: () => router.back() }) },
            ]);
          }} loading={withdraw.isPending} />
        )}
        {canAction && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button label={t('shortlist')} variant="secondary" onPress={() => shortlist.mutate(proposal.id)} loading={shortlist.isPending} />
            </View>
            <View className="flex-1">
              <Button label={t('reject')} variant="danger" onPress={() => reject.mutate(proposal.id)} loading={reject.isPending} />
            </View>
            <View className="flex-1">
              <Button label={t('accept')} onPress={() => {
                Alert.alert('Accept this proposal?', 'This will create an engagement and close other proposals.', [
                  { text: t('cancel'), style: 'cancel' },
                  { text: t('accept'), onPress: () => accept.mutate(proposal.id, { onSuccess: () => router.back() }) },
                ]);
              }} loading={accept.isPending} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
