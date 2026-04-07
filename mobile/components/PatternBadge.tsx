import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { PatternResult } from '@/store/useTradeStore';

interface Props {
  pattern: PatternResult;
  isSelected: boolean;
  onPress: () => void;
}

const CONFIDENCE_COLOR = (conf: number) => {
  if (conf >= 0.75) return '#34d399';
  if (conf >= 0.5) return '#fbbf24';
  return '#f87171';
};

/**
 * Compact badge for a detected pattern in the pattern list.
 */
export function PatternBadge({ pattern, isSelected, onPress }: Props) {
  const confColor = CONFIDENCE_COLOR(pattern.confidence);
  const confPct = Math.round(pattern.confidence * 100);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.left}>
        <Text style={styles.patternName}>{pattern.pattern}</Text>
        <Text style={styles.direction}>{pattern.direction}</Text>
      </View>

      <View style={styles.right}>
        {/* Confidence gauge */}
        <View style={styles.confRow}>
          <View style={styles.confBarBg}>
            <View style={[styles.confBarFill, { width: `${confPct}%` as any, backgroundColor: confColor }]} />
          </View>
          <Text style={[styles.confText, { color: confColor }]}>{confPct}%</Text>
        </View>
        <Text style={styles.rrLabel}>
          {pattern.rr_label ?? `R/R 1:${pattern.risk_reward_ratio.toFixed(1)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardSelected: { borderColor: '#22d3ee' },
  left: { flex: 1 },
  patternName: { color: '#f9fafb', fontWeight: '700', fontSize: 14 },
  direction: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confBarBg: {
    width: 60,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confBarFill: { height: '100%', borderRadius: 2 },
  confText: { fontSize: 11, fontWeight: '600', width: 30 },
  rrLabel: { color: '#9ca3af', fontSize: 12 },
});
