import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/api';
import { useTradeStore } from '@/store/useTradeStore';

interface QuoteRow {
  symbol: string;
  price: number | null;
  trend_pct: number | null;
  loading: boolean;
}

export default function WatchlistScreen() {
  const router = useRouter();
  const { watchlist, removeFromWatchlist } = useTradeStore();

  const [quotes, setQuotes] = useState<Record<string, Omit<QuoteRow, 'symbol'>>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuotes = useCallback(
    async (symbols: string[], showRefreshing = false) => {
      if (symbols.length === 0) return;
      if (showRefreshing) setRefreshing(true);

      setQuotes((prev) => {
        const next = { ...prev };
        symbols.forEach((s) => {
          next[s] = { ...(prev[s] ?? { price: null, trend_pct: null }), loading: true };
        });
        return next;
      });

      await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const res = await axios.get(`${BASE_URL}/ohlc/${symbol}`, {
              params: { period: '5d', interval: '1d' },
            });
            const summary = res.data.summary;
            setQuotes((prev) => ({
              ...prev,
              [symbol]: {
                price: summary?.close ?? null,
                trend_pct: summary?.trend_pct ?? null,
                loading: false,
              },
            }));
          } catch {
            setQuotes((prev) => ({
              ...prev,
              [symbol]: { price: null, trend_pct: null, loading: false },
            }));
          }
        }),
      );

      if (showRefreshing) setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    fetchQuotes(watchlist);
  }, [watchlist.join(',')]);

  const onRefresh = () => fetchQuotes(watchlist, true);

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
        <Text style={styles.subtitle}>
          {watchlist.length} symbol{watchlist.length !== 1 ? 's' : ''} saved
        </Text>

        {watchlist.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>
              Search for a symbol and tap + to add it to your watchlist.
            </Text>
          </View>
        ) : (
          <FlatList
            data={watchlist}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#22d3ee"
                colors={['#22d3ee']}
              />
            }
            renderItem={({ item }) => {
              const q = quotes[item];
              const isPositive = (q?.trend_pct ?? 0) >= 0;
              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => router.push(`/chart/${item}`)}
                  onLongPress={() => confirmRemove(item)}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.symbol}>{item}</Text>
                    <Text style={styles.hint}>Hold to remove</Text>
                  </View>

                  <View style={styles.rowRight}>
                    {q?.loading ? (
                      <ActivityIndicator size="small" color="#22d3ee" />
                    ) : q?.price != null ? (
                      <>
                        <Text style={styles.price}>${q.price.toFixed(2)}</Text>
                        {q.trend_pct != null && (
                          <View style={[styles.trendBadge, isPositive ? styles.trendGreen : styles.trendRed]}>
                            <Text style={[styles.trendText, isPositive ? styles.trendTextGreen : styles.trendTextRed]}>
                              {isPositive ? '+' : ''}{q.trend_pct.toFixed(2)}%
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={styles.priceUnavailable}>—</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    marginBottom: 8,
  },
  rowLeft: { gap: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  symbol: { fontSize: 17, fontWeight: '700', color: '#f9fafb' },
  hint: { fontSize: 11, color: '#4b5563' },
  price: { fontSize: 16, fontWeight: '600', color: '#f9fafb' },
  priceUnavailable: { fontSize: 14, color: '#4b5563' },
  trendBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  trendGreen: { backgroundColor: 'rgba(52,211,153,0.15)' },
  trendRed: { backgroundColor: 'rgba(248,113,113,0.15)' },
  trendText: { fontSize: 12, fontWeight: '700' },
  trendTextGreen: { color: '#34d399' },
  trendTextRed: { color: '#f87171' },
  separator: { height: 0 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f9fafb' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 260 },
});
