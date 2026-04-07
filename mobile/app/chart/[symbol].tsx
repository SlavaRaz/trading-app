import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import axios from 'axios';
import { BASE_URL, PERIODS } from '@/constants/api';
import type { Period } from '@/constants/api';
import { useTradeStore } from '@/store/useTradeStore';
import type { Candle, PatternResult } from '@/store/useTradeStore';
import { CandlestickChart } from '@/components/CandlestickChart';
import { PatternBadge } from '@/components/PatternBadge';
import { RiskRewardPanel } from '@/components/RiskRewardPanel';
import { AIChatDrawer } from '@/components/AIChatDrawer';

export default function ChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const navigation = useNavigation();

  const {
    candles, patterns, ohlcSummary, selectedPeriod,
    setCandles, setPatterns, setOhlcSummary, setPeriod,
    setCandlesLoading, setPatternsLoading,
    isCandlesLoading, isPatternsLoading,
    addToWatchlist,
  } = useTradeStore();

  const [selectedPatternIdx, setSelectedPatternIdx] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    if (symbol) navigation.setOptions({ title: symbol });
  }, [symbol, navigation]);

  const fetchData = useCallback(
    async (period: Period) => {
      if (!symbol) return;
      setCandlesLoading(true);
      setPatternsLoading(true);

      try {
        const [ohlcRes, patternsRes] = await Promise.all([
          axios.get(`${BASE_URL}/ohlc/${symbol}`, { params: { period, interval: '1d' } }),
          axios.get(`${BASE_URL}/patterns/${symbol}`, { params: { period, interval: '1d' } }),
        ]);

        const rawCandles: Candle[] = ohlcRes.data.candles;
        setCandles(rawCandles);
        setOhlcSummary({
          open: ohlcRes.data.summary?.open ?? rawCandles[0]?.open ?? 0,
          close: ohlcRes.data.summary?.close ?? rawCandles.at(-1)?.close ?? 0,
          high: ohlcRes.data.summary?.high ?? Math.max(...rawCandles.map((c) => c.high)),
          low: ohlcRes.data.summary?.low ?? Math.min(...rawCandles.map((c) => c.low)),
          trend_pct: ohlcRes.data.summary?.trend_pct ?? 0,
          avg_volume: ohlcRes.data.summary?.avg_volume ?? 0,
          period,
        });

        setPatterns(patternsRes.data.patterns ?? []);
        setSelectedPatternIdx(null);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setCandlesLoading(false);
        setPatternsLoading(false);
      }
    },
    [symbol],
  );

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [symbol]);

  const onPeriodChange = (period: Period) => {
    setPeriod(period);
    fetchData(period);
  };

  const handleAddWatchlist = () => {
    if (symbol) {
      addToWatchlist(symbol);
      setInWatchlist(true);
    }
  };

  const selectedPattern: PatternResult | null =
    selectedPatternIdx !== null ? patterns[selectedPatternIdx] ?? null : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} bounces={false}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
              onPress={() => onPeriodChange(p)}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary bar */}
        {ohlcSummary && (
          <View style={styles.summaryRow}>
            <Text style={styles.closePrice}>${ohlcSummary.close.toFixed(2)}</Text>
            <Text
              style={[
                styles.trendPct,
                ohlcSummary.trend_pct >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {ohlcSummary.trend_pct >= 0 ? '+' : ''}
              {ohlcSummary.trend_pct.toFixed(2)}%
            </Text>
          </View>
        )}

        {/* Chart */}
        {isCandlesLoading ? (
          <View style={styles.chartPlaceholder}>
            <ActivityIndicator color="#22d3ee" size="large" />
          </View>
        ) : (
          <CandlestickChart
            candles={candles}
            selectedPattern={selectedPattern}
          />
        )}

        {/* R/R panel for selected pattern */}
        {selectedPattern && <RiskRewardPanel pattern={selectedPattern} />}

        {/* Pattern list */}
        <Text style={styles.sectionLabel}>Detected Patterns</Text>
        {isPatternsLoading ? (
          <ActivityIndicator color="#22d3ee" style={{ marginTop: 8 }} />
        ) : patterns.length === 0 ? (
          <Text style={styles.noPatternsText}>No patterns detected for this period.</Text>
        ) : (
          patterns.map((p, idx) => (
            <PatternBadge
              key={`${p.pattern}-${idx}`}
              pattern={p}
              isSelected={selectedPatternIdx === idx}
              onPress={() => setSelectedPatternIdx(selectedPatternIdx === idx ? null : idx)}
            />
          ))
        )}

        {/* Watchlist button */}
        <TouchableOpacity
          style={[styles.watchlistBtn, inWatchlist && styles.watchlistBtnAdded]}
          onPress={handleAddWatchlist}
          disabled={inWatchlist}
        >
          <Text style={styles.watchlistBtnText}>
            {inWatchlist ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating AI chat button */}
      <TouchableOpacity style={styles.chatFab} onPress={() => setChatOpen(true)}>
        <Text style={styles.chatFabText}>AI</Text>
      </TouchableOpacity>

      {chatOpen && (
        <AIChatDrawer
          symbol={symbol ?? ''}
          patterns={patterns}
          ohlcSummary={ohlcSummary}
          onClose={() => setChatOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },

  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  periodBtnActive: { backgroundColor: '#22d3ee' },
  periodText: { fontSize: 12, fontWeight: '600', color: '#9ca3af' },
  periodTextActive: { color: '#0f0f0f' },

  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  closePrice: { fontSize: 26, fontWeight: '700', color: '#f9fafb' },
  trendPct: { fontSize: 16, fontWeight: '600' },
  positive: { color: '#34d399' },
  negative: { color: '#f87171' },

  chartPlaceholder: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  noPatternsText: { color: '#6b7280', fontSize: 14 },

  watchlistBtn: {
    marginTop: 24,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  watchlistBtnAdded: { borderColor: '#34d399' },
  watchlistBtnText: { color: '#22d3ee', fontWeight: '600', fontSize: 15 },

  chatFab: {
    position: 'absolute',
    bottom: 32,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  chatFabText: { color: '#0f0f0f', fontWeight: '800', fontSize: 14 },
});
