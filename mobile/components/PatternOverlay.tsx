import { useMemo } from 'react';
import { Group, Rect, Path, Skia } from '@shopify/react-native-skia';
import type { PatternResult } from '@/store/useTradeStore';

interface Props {
  pattern: PatternResult;
  chartWidth: number;
  priceChartHeight: number;
  toY: (price: number) => number;
}

/** Creates a dashed horizontal path at the given Y position across the chart width. */
function makeDashedLine(y: number, width: number, dashLen = 7, gapLen = 5): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  let x = 0;
  let isDash = true;
  while (x < width) {
    if (isDash) {
      path.moveTo(x, y);
      path.lineTo(Math.min(x + dashLen, width), y);
    }
    x += isDash ? dashLen : gapLen;
    isDash = !isDash;
  }
  return path;
}

/**
 * Renders pattern overlay elements inside a Skia Canvas:
 * - Semi-transparent shaded zones between entry→target (green) and entry→stop-loss (red)
 * - Dashed lines for entry (cyan), target (green), and stop-loss (red)
 *
 * Must be rendered as a child of a <Canvas> component.
 */
export function PatternOverlay({ pattern, chartWidth, priceChartHeight, toY }: Props) {
  const entryY = toY(pattern.entry_price);
  const targetY = toY(pattern.target_price);
  const slY = toY(pattern.stop_loss);

  const { entryPath, targetPath, slPath } = useMemo(
    () => ({
      entryPath: makeDashedLine(entryY, chartWidth),
      targetPath: makeDashedLine(targetY, chartWidth),
      slPath: makeDashedLine(slY, chartWidth),
    }),
    [entryY, targetY, slY, chartWidth],
  );

  // Shaded zone geometry — clamped to the price chart area
  const clamp = (v: number) => Math.max(0, Math.min(priceChartHeight, v));

  const gainZoneTop = clamp(Math.min(entryY, targetY));
  const gainZoneH = clamp(Math.max(entryY, targetY)) - gainZoneTop;

  const riskZoneTop = clamp(Math.min(entryY, slY));
  const riskZoneH = clamp(Math.max(entryY, slY)) - riskZoneTop;

  return (
    <Group>
      {/* Gain zone: entry → target */}
      <Rect
        x={0}
        y={gainZoneTop}
        width={chartWidth}
        height={gainZoneH}
        color="rgba(52, 211, 153, 0.07)"
      />

      {/* Risk zone: entry → stop-loss */}
      <Rect
        x={0}
        y={riskZoneTop}
        width={chartWidth}
        height={riskZoneH}
        color="rgba(248, 113, 113, 0.07)"
      />

      {/* Entry line — cyan dashed */}
      <Path path={entryPath} color="#22d3ee" strokeWidth={1.5} style="stroke" />

      {/* Target line — green dashed */}
      <Path path={targetPath} color="#34d399" strokeWidth={1.5} style="stroke" />

      {/* Stop-loss line — red dashed */}
      <Path path={slPath} color="#f87171" strokeWidth={1.5} style="stroke" />
    </Group>
  );
}
