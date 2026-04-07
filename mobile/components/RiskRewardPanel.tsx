import { View, Text, StyleSheet } from 'react-native';
import type { PatternResult } from '@/store/useTradeStore';

interface Props {
  pattern: PatternResult;
}

const RR_COLORS: Record<PatternResult['rr_rating'], string> = {
  good: '#34d399',
  fair: '#fbbf24',
  poor: '#f87171',
};

/**
 * Displays entry / target / stop-loss levels and risk-reward ratio for a pattern.
 */
export function RiskRewardPanel({ pattern }: Props) {
  const gainPct = ((pattern.target_price - pattern.entry_price) / pattern.entry_price) * 100;
  const lossPct = ((pattern.entry_price - pattern.stop_loss) / pattern.entry_price) * 100;
  const rrColor = RR_COLORS[pattern.rr_rating] ?? '#9ca3af';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Risk / Reward</Text>
        <View style={[styles.rrBadge, { backgroundColor: rrColor + '22', borderColor: rrColor }]}>
          <Text style={[styles.rrText, { color: rrColor }]}>
            R/R {pattern.rr_label ?? `1:${pattern.risk_reward_ratio.toFixed(1)}`}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <LevelItem label="Entry" price={pattern.entry_price} color="#22d3ee" />
        <LevelItem label="Target" price={pattern.target_price} color="#34d399" change={gainPct} />
        <LevelItem label="Stop Loss" price={pattern.stop_loss} color="#f87171" change={-lossPct} />
      </View>
    </View>
  );
}

function LevelItem({ label, price, color, change }: {
  label: string;
  price: number;
  color: string;
  change?: number;
}) {
  return (
    <View style={styles.levelItem}>
      <Text style={[styles.levelLabel, { color }]}>{label}</Text>
      <Text style={styles.levelPrice}>${price.toFixed(2)}</Text>
      {change !== undefined && (
        <Text style={[styles.levelChange, { color }]}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: '#f9fafb', fontWeight: '700', fontSize: 15 },
  rrBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rrText: { fontWeight: '700', fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  levelItem: { alignItems: 'center', flex: 1 },
  levelLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  levelPrice: { fontSize: 14, fontWeight: '700', color: '#f9fafb' },
  levelChange: { fontSize: 11, marginTop: 2 },
});
