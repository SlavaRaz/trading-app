import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTradeStore } from '@/store/useTradeStore';

export default function WatchlistScreen() {
  const router = useRouter();
  const { watchlist, removeFromWatchlist } = useTradeStore();

  const confirmRemove = (symbol: string) => {
    Alert.alert('Remove from watchlist', `Remove ${symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromWatchlist(symbol) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Watchlist</Text>
        <Text style={styles.subtitle}>{watchlist.length} symbol{watchlist.length !== 1 ? 's' : ''} saved</Text>

        {watchlist.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Search for a symbol and add it to your watchlist.</Text>
          </View>
        ) : (
          <FlatList
            data={watchlist}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/chart/${item}`)}
                onLongPress={() => confirmRemove(item)}
              >
                <Text style={styles.symbol}>{item}</Text>
                <Text style={styles.hint}>Hold to remove  ›</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#f9fafb', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    marginBottom: 8,
  },
  symbol: { fontSize: 17, fontWeight: '700', color: '#f9fafb' },
  hint: { fontSize: 12, color: '#6b7280' },
  separator: { height: 0 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 260 },
});
