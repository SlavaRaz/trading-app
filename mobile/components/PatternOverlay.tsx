import { View, StyleSheet } from 'react-native';
import type { PatternResult } from '@/store/useTradeStore';

interface Props {
  pattern: PatternResult | null;
  chartHeight: number;
  chartWidth: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Renders dashed horizontal lines for entry, target, and stop-loss on the chart canvas.
 * Coordinate math mirrors CandlestickChart's toY function.
 */
export function PatternOverlay({ pattern, chartHeight, chartWidth, minPrice, maxPrice }: Props) {
  if (!pattern) return null;

  const priceRange = maxPrice - minPrice || 1;
  const toY = (price: number) =>
    chartHeight - 20 - ((price - minPrice) / priceRange) * (chartHeight - 40);

  const lines = [
    { price: pattern.entry_price, color: '#22d3ee' },
    { price: pattern.target_price, color: '#34d399' },
    { price: pattern.stop_loss, color: '#f87171' },
  ];

  return (
    <>
      {lines.map(({ price, color }) => {
        const y = toY(price);
        if (y < 0 || y > chartHeight) return null;
        return (
          <View
            key={`${color}-${price}`}
            style={[
              styles.line,
              {
                top: y,
                width: chartWidth,
                borderColor: color,
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
  },
});
