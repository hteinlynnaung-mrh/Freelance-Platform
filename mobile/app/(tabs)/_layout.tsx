import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useTheme } from '../../src/theme/ThemeProvider';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text className={focused ? 'opacity-100' : 'opacity-40'} style={{ fontSize: 22 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { isDark } = useTheme();
  const isFreelancer = user?.role === 'FREELANCER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('projects'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="freelancers"
        options={{
          title: t('freelancers'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
          href: isFreelancer ? null : undefined, // hide for freelancers
        }}
      />
      <Tabs.Screen
        name="proposals"
        options={{
          title: t('proposals'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="📩" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="engagements"
        options={{
          title: t('engagements'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('messages'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
