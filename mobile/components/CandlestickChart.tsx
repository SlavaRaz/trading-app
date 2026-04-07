import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Line, Rect, Path, Skia, Group } from '@shopify/react-native-skia';
import type { Candle, PatternResult } from '@/store/useTradeStore';
import { PatternOverlay } from './PatternOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CANVAS_HEIGHT = 320;
const PRICE_SECTION_HEIGHT = 260;
const VOLUME_SECTION_HEIGHT = 50;
const PADDING_TOP = 14;
const PADDING_RIGHT = 58;
const PRICE_AREA_HEIGHT = PRICE_SECTION_HEIGHT - PADDING_TOP - 10;

interface Props {
  candles: Candle[];
  selectedPattern: PatternResult | null;
}

export function CandlestickChart({ candles, selectedPattern }: Props) {
  const canvasWidth = SCREEN_WIDTH - 32;
  const drawWidth = canvasWidth - PADDING_RIGHT;

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (candles.length === 0) return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    return {
      minPrice: Math.min(...candles.map((c) => c.low)),
      maxPrice: Math.max(...candles.map((c) => c.high)),
      maxVolume: Math.max(...candles.map((c) => c.volume)),
    };
  }, [candles]);

  const priceRange = maxPrice - minPrice || 1;

  const toY = useCallback(
    (price: number) =>
      PADDING_TOP + (1 - (price - minPrice) / priceRange) * PRICE_AREA_HEIGHT,
    [minPrice, priceRange],
  );

  const { candleBodyWidth, candleSlotWidth } = useMemo(() => {
    const slot = candles.length > 0 ? drawWidth / candles.length : 8;
    return {
      candleSlotWidth: slot,
      candleBodyWidth: Math.max(1.5, slot * 0.62),
    };
  }, [candles.length, drawWidth]);

  const gridPrices = useMemo(
    () => [
      maxPrice,
      minPrice + priceRange * 0.75,
      minPrice + priceRange * 0.5,
      minPrice + priceRange * 0.25,
      minPrice,
    ],
    [minPrice, maxPrice, priceRange],
  );

  const gridPaths = useMemo(
    () =>
      gridPrices.map((price) => {
        const y = toY(price);
        const p = Skia.Path.Make();
        p.moveTo(0, y);
        p.lineTo(drawWidth, y);
        return { price, path: p };
      }),
    [gridPrices, toY, drawWidth],
  );

  const separatorPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(0, PRICE_SECTION_HEIGHT);
    p.lineTo(drawWidth, PRICE_SECTION_HEIGHT);
    return p;
  }, [drawWidth]);

  const patternLabels: Array<{ label: string; color: string; price: number }> = selectedPattern
    ? [
        { label: 'Entry', color: '#22d3ee', price: selectedPattern.entry_price },
        { label: 'Target', color: '#34d399', price: selectedPattern.target_price },
        { label: 'SL', color: '#f87171', price: selectedPattern.stop_loss },
      ]
    : [];

  if (candles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No chart data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { height: CANVAS_HEIGHT }]}>
      <Canvas style={{ width: canvasWidth, height: CANVAS_HEIGHT }}>
        {/* Subtle grid lines */}
        {gridPaths.map(({ price, path }) => (
          <Path key={price} path={path} color="#1e2a3a" strokeWidth={0.5} style="stroke" />
        ))}

        {/* Price / volume separator */}
        <Path path={separatorPath} color="#1e2a3a" strokeWidth={1} style="stroke" />

        {/* Candles */}
        {candles.map((c, i) => {
          const isGreen = c.close >= c.open;
          const color = isGreen ? '#34d399' : '#f87171';
          const slotX = i * candleSlotWidth;
          const bodyX = slotX + (candleSlotWidth - candleBodyWidth) / 2;
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          const wickX = slotX + candleSlotWidth / 2;

          const volH = Math.max(1, (c.volume / maxVolume) * (VOLUME_SECTION_HEIGHT - 8));
          const volY = PRICE_SECTION_HEIGHT + 4 + (VOLUME_SECTION_HEIGHT - 8 - volH);

          return (
            <Group key={i}>
              {/* Wick */}
              <Line
                p1={{ x: wickX, y: toY(c.high) }}
                p2={{ x: wickX, y: toY(c.low) }}
                color={color}
                strokeWidth={1}
              />
              {/* Body */}
              <Rect x={bodyX} y={bodyTop} width={candleBodyWidth} height={bodyH} color={color} />
              {/* Volume bar */}
              <Rect
                x={bodyX}
                y={volY}
                width={candleBodyWidth}
                height={volH}
                color={color}
                opacity={0.4}
              />
            </Group>
          );
        })}

        {/* Pattern overlay (dashed lines + shaded zones) */}
        {selectedPattern && (
          <PatternOverlay
            pattern={selectedPattern}
            chartWidth={drawWidth}
            priceChartHeight={PRICE_SECTION_HEIGHT}
            toY={toY}
          />
        )}
      </Canvas>

      {/* Price axis labels */}
      {gridPrices.map((price) => {
        const y = toY(price);
        return (
          <Text key={price} style={[styles.priceLabel, { top: y - 7 }]}>
            {formatPrice(price)}
          </Text>
        );
      })}

      {/* Pattern price labels */}
      {patternLabels.map(({ label, color, price }) => {
        const y = toY(price);
        if (y < 0 || y > PRICE_SECTION_HEIGHT) return null;
        return (
          <View key={label} style={[styles.overlayLabelRow, { top: y - 9 }]}>
            <Text style={[styles.overlayLabel, { color }]}>
              {label} {formatPrice(price)}
            </Text>
          </View>
        );
      })}

      {/* Volume section label */}
      <Text style={[styles.sectionTag, { top: PRICE_SECTION_HEIGHT + 6 }]}>VOL</Text>
    </View>
  );
}

function formatPrice(price: number): string {
  if (price >= 10_000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 1_000) return `$${price.toFixed(0)}`;
  if (price >= 100) return `$${price.toFixed(1)}`;
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#080e1a',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  empty: {
    height: CANVAS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080e1a',
    borderRadius: 14,
    marginBottom: 16,
  },
  emptyText: { color: '#4b5563', fontSize: 14 },
  priceLabel: {
    position: 'absolute',
    right: 4,
    fontSize: 9,
    color: '#374151',
    fontWeight: '500',
  },
  overlayLabelRow: {
    position: 'absolute',
    right: 4,
    alignItems: 'flex-end',
  },
  overlayLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTag: {
    position: 'absolute',
    left: 5,
    fontSize: 8,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.8,
  },
});
