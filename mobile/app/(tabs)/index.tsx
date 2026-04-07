import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/api';
import { useTradeStore } from '@/store/useTradeStore';

const POPULAR_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'BTC-USD', 'ETH-USD', 'SPY', 'QQQ', 'NVDA'];

export default function HomeScreen() {
  const router = useRouter();
  const { addToWatchlist } = useTradeStore();

  const [query, setQuery] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigateToChart = useCallback(
    async (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      if (!upper) return;

      setError(null);
      setIsValidating(true);

      try {
        await axios.get(`${BASE_URL}/ohlc/${upper}`, { params: { period: '5d', interval: '1d' } });
        router.push(`/chart/${upper}`);
      } catch {
        setError(`Symbol "${upper}" not found or backend unavailable.`);
      } finally {
        setIsValidating(false);
      }
    },
    [router],
  );

  const handleSearch = () => navigateToChart(query);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Markets</Text>
        <Text style={styles.subtitle}>Search any stock or crypto symbol</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. AAPL, BTC-USD…"
            placeholderTextColor="#4b5563"
            value={query}
            onChangeText={(t) => {
              setQuery(t.toUpperCase());
              setError(null);
            }}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={[styles.searchBtn, isValidating && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={isValidating || !query.trim()}
          >
            {isValidating ? (
              <ActivityIndicator color="#0f0f0f" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Go</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.sectionLabel}>Popular</Text>
        <FlatList
          data={POPULAR_SYMBOLS}
          keyExtractor={(item) => item}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chip} onPress={() => navigateToChart(item)}>
              <Text style={styles.chipText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#f9fafb', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  searchBtn: {
    backgroundColor: '#22d3ee',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: '#0f0f0f', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#f87171', fontSize: 13, marginBottom: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#9ca3af', marginTop: 24, marginBottom: 12, letterSpacing: 0.5 },
  columnWrapper: { gap: 10, marginBottom: 10 },
  chip: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipText: { color: '#f9fafb', fontWeight: '600', fontSize: 15 },
});
