import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

function TabIcon({ focused, color, name }: { focused: boolean; color: string; name: string }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      {/* Icon placeholder — swap with expo-vector-icons when desired */}
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="markets" />
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} name="watchlist" />
          ),
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
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderRadius: 6,
  },
});
