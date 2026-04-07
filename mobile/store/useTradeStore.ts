import { create } from 'zustand';
import type { Period, Interval } from '@/constants/api';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternResult {
  pattern: string;
  direction: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  risk_reward_ratio: number;
  rr_label: string;
  rr_rating: 'good' | 'fair' | 'poor';
  confidence: number;
  candle_range: [number, number];
}

export interface OhlcSummary {
  open: number;
  close: number;
  high: number;
  low: number;
  trend_pct: number;
  avg_volume: number;
  period: string;
}

interface TradeState {
  watchlist: string[];
  selectedSymbol: string | null;
  candles: Candle[];
  patterns: PatternResult[];
  ohlcSummary: OhlcSummary | null;
  selectedPeriod: Period;
  selectedInterval: Interval;
  isCandlesLoading: boolean;
  isPatternsLoading: boolean;

  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setSelectedSymbol: (symbol: string) => void;
  setCandles: (candles: Candle[]) => void;
  setPatterns: (patterns: PatternResult[]) => void;
  setOhlcSummary: (summary: OhlcSummary) => void;
  setPeriod: (period: Period) => void;
  setInterval: (interval: Interval) => void;
  setCandlesLoading: (loading: boolean) => void;
  setPatternsLoading: (loading: boolean) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  watchlist: ['AAPL', 'BTC-USD', 'TSLA', 'SPY'],
  selectedSymbol: null,
  candles: [],
  patterns: [],
  ohlcSummary: null,
  selectedPeriod: '3mo',
  selectedInterval: '1d',
  isCandlesLoading: false,
  isPatternsLoading: false,

  addToWatchlist: (symbol) =>
    set((state) => ({
      watchlist: state.watchlist.includes(symbol) ? state.watchlist : [...state.watchlist, symbol],
    })),

  removeFromWatchlist: (symbol) =>
    set((state) => ({ watchlist: state.watchlist.filter((s) => s !== symbol) })),

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setCandles: (candles) => set({ candles }),
  setPatterns: (patterns) => set({ patterns }),
  setOhlcSummary: (ohlcSummary) => set({ ohlcSummary }),
  setPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setInterval: (selectedInterval) => set({ selectedInterval }),
  setCandlesLoading: (isCandlesLoading) => set({ isCandlesLoading }),
  setPatternsLoading: (isPatternsLoading) => set({ isPatternsLoading }),
}));
