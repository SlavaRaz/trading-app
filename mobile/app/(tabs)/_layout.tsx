import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

const TAB_ICONS: Record<string, string> = {
  markets: '◈',
  watchlist: '★',
};

function TabIcon({ focused, name }: { focused: boolean; name: string }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
        {TAB_ICONS[name] ?? '●'}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Markets',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="markets" />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="watchlist" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111827',
    borderTopColor: '#1f2937',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  iconFocused: {
    backgroundColor: 'rgba(34,211,238,0.15)',
  },
  iconText: {
    fontSize: 16,
    color: '#6b7280',
  },
  iconTextFocused: {
    color: '#22d3ee',
  },
});
