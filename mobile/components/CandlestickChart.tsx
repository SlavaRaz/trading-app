import { View, Text, StyleSheet, Dimensions } from 'react-native';
import type { Candle, PatternResult } from '@/store/useTradeStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 280;

interface Props {
  candles: Candle[];
  selectedPattern: PatternResult | null;
}

/**
 * Renders a basic candlestick chart using React Native Views.
 * Replace with a victory-native / Skia implementation for production quality.
 */
export function CandlestickChart({ candles, selectedPattern }: Props) {
  if (candles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No chart data</Text>
      </View>
    );
  }

  const allValues = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const priceRange = maxPrice - minPrice || 1;

  const canvasWidth = SCREEN_WIDTH - 32;
  const candleWidth = Math.max(2, Math.floor((canvasWidth / candles.length) * 0.6));
  const gap = Math.max(1, Math.floor((canvasWidth / candles.length) * 0.4));

  const toY = (price: number) =>
    CHART_HEIGHT - 20 - ((price - minPrice) / priceRange) * (CHART_HEIGHT - 40);

  const patternLines = selectedPattern
    ? [
        { price: selectedPattern.entry_price, color: '#22d3ee', label: 'Entry' },
        { price: selectedPattern.target_price, color: '#34d399', label: 'Target' },
        { price: selectedPattern.stop_loss, color: '#f87171', label: 'SL' },
      ]
    : [];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.canvas, { height: CHART_HEIGHT }]}>
        {candles.map((c, i) => {
          const x = i * (candleWidth + gap);
          const isGreen = c.close >= c.open;
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyHeight = Math.max(1, Math.abs(toY(c.open) - toY(c.close)));
          const wickTop = toY(c.high);
          const wickHeight = toY(c.low) - toY(c.high);

          return (
            <View key={i} style={[StyleSheet.absoluteFillObject, { left: x }]}>
              {/* Wick */}
              <View
                style={{
                  position: 'absolute',
                  left: candleWidth / 2 - 0.5,
                  top: wickTop,
                  width: 1,
                  height: wickHeight,
                  backgroundColor: isGreen ? '#34d399' : '#f87171',
                }}
              />
              {/* Body */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: bodyTop,
                  width: candleWidth,
                  height: bodyHeight,
                  backgroundColor: isGreen ? '#34d399' : '#f87171',
                  opacity: 0.85,
                }}
              />
            </View>
          );
        })}

        {/* Pattern overlay lines */}
        {patternLines.map(({ price, color, label }) => {
          const y = toY(price);
          if (y < 0 || y > CHART_HEIGHT) return null;
          return (
            <View
              key={label}
              style={[styles.overlayLine, { top: y, borderColor: color }]}
            >
              <Text style={[styles.overlayLabel, { color }]}>{label} ${price.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Price axis labels */}
      <View style={styles.priceAxis}>
        <Text style={styles.axisLabel}>${maxPrice.toFixed(0)}</Text>
        <Text style={styles.axisLabel}>${((maxPrice + minPrice) / 2).toFixed(0)}</Text>
        <Text style={styles.axisLabel}>${minPrice.toFixed(0)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: 4,
  },
  empty: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: { color: '#6b7280' },
  overlayLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  overlayLabel: {
    position: 'absolute',
    right: 4,
    top: -16,
    fontSize: 10,
    fontWeight: '600',
  },
  priceAxis: {
    width: 52,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingRight: 6,
    alignItems: 'flex-end',
  },
  axisLabel: { fontSize: 10, color: '#6b7280' },
});
