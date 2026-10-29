import { useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMessages, useSendMessage, useConversations } from '../../../src/api/hooks/useConversations';
import { useAuth } from '../../../src/auth/AuthContext';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ScreenHeader } from '../../../src/components/ui/ScreenHeader';
import { useI18n } from '../../../src/i18n/I18nProvider';

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const flatListRef = useRef<FlatList>(null);

  const { data: convData } = useConversations();
  const conv = (convData?.data ?? []).find((c) => c.id === id);
  const other = conv?.participants.find((p) => p.userId !== user?.id);
  const title = other?.user.freelancerProfile?.displayName ?? other?.user.clientProfile?.displayName ?? other?.user.email ?? 'Chat';

  const { data, isLoading, error } = useMessages(id!);
  const send = useSendMessage(id!);
  const messages = data?.data ?? [];

  const handleSend = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      await send.mutateAsync(text);
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (e: any) {
      Alert.alert(e?.message ?? t('somethingWentWrong'));
    }
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={['top']}>
      <ScreenHeader title={title} showBack />
      {error && <ErrorBanner message={t('somethingWentWrong')} />}
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerClassName="p-4 gap-3"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item: msg }) => {
            const isMine = msg.senderId === user?.id;
            return (
              <View className={`max-w-xs ${isMine ? 'self-end' : 'self-start'}`}>
                <View className={`px-4 py-3 rounded-2xl ${
                  isMine
                    ? 'bg-indigo-600 rounded-br-sm'
                    : 'bg-slate-100 dark:bg-slate-700 rounded-bl-sm'
                }`}>
                  <Text className={`text-sm ${isMine ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {msg.body}
                  </Text>
                </View>
                <Text className={`text-xs text-slate-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          }}
        />
        {/* Input */}
        <View className="flex-row items-end gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TextInput
            ref={inputRef}
            className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-slate-100 text-base max-h-28"
            placeholder={t('typeMessage')}
            placeholderTextColor="#94a3b8"
            value={body}
            onChangeText={setBody}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!body.trim() || send.isPending}
            className={`bg-indigo-600 rounded-2xl p-3 ${!body.trim() ? 'opacity-40' : 'active:opacity-70'}`}
          >
            <Text className="text-white text-lg">↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
