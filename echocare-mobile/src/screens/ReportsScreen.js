import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { patientsApi } from '../services/api';
import { colors, fonts, spacing } from '../theme';
import { FlameIcon } from '../components/Icons';

const W = Dimensions.get('window').width - 72;

export default function ReportsScreen() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    patientsApi.list()
      .then(res => { const l = res.data.data || []; setPatients(l); if (l.length > 0) setSelected(l[0]._id); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setStatsLoading(true);
    patientsApi.stats(selected, days)
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [selected, days]);

  const sp = patients.find(p => p._id === selected);
  const pctColor = (v) => v >= 80 ? colors.green500 : v >= 50 ? colors.amber500 : colors.red500;

  const trendData = stats?.adherenceTrend?.slice(-14) || [];
  const trendLabels = trendData.map(d => { const dt = new Date(d.date); return `${dt.getDate()}/${dt.getMonth() + 1}`; });
  const trendValues = trendData.map(d => d.adherencePercentage);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reports</Text>

        {/* Patient Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
          {patients.map(p => (
            <TouchableOpacity key={p._id} style={[styles.selBtn, selected === p._id && styles.selBtnActive]} onPress={() => setSelected(p._id)}>
              <Text style={[styles.selText, selected === p._id && styles.selTextActive]}>{p.preferredName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Period */}
        <View style={styles.periodRow}>
          {[{ d: 7, l: 'Week' }, { d: 14, l: '2 Weeks' }, { d: 30, l: '30 Days' }].map(({ d, l }) => (
            <TouchableOpacity key={d} style={[styles.periodBtn, days === d && styles.periodBtnActive]} onPress={() => setDays(d)}>
              <Text style={[styles.periodText, days === d && styles.periodTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {stats && !statsLoading ? (
          <View>
            {/* Summary */}
            <View style={styles.grid}>
              <RStat label="Calls Done" value={stats.callStats?.completed || 0} sub={`of ${stats.callStats?.total || 0}`} color={colors.moss700} />
              <RStat label="No-Answer" value={stats.callStats?.noAnswer || 0} sub="unanswered" color={(stats.callStats?.noAnswer || 0) > 3 ? colors.red500 : colors.moss700} />
              <RStat label="Streak" value={sp?.currentStreak || 0} sub={`best: ${sp?.longestStreak || 0}`} color={colors.terra500} icon={<FlameIcon size={12} color={colors.sand400} />} />
              <RStat label="Mood Logs" value={stats.moodHistory?.length || 0} sub="this period" color={colors.moss700} />
            </View>

            {/* Per Med */}
            {stats.perMedicineAdherence?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Per-Medicine Compliance</Text>
                {stats.perMedicineAdherence.map((m, i) => (
                  <View key={i} style={styles.medBar}>
                    <Text style={styles.medBarName} numberOfLines={1}>{m.name}</Text>
                    <View style={styles.medBarTrack}><View style={[styles.medBarFill, { width: `${m.percentage}%`, backgroundColor: pctColor(m.percentage) }]} /></View>
                    <Text style={[styles.medBarPct, { color: pctColor(m.percentage) }]}>{m.percentage}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Trend */}
            {trendValues.length > 1 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Trend</Text>
                <LineChart
                  data={{ labels: trendLabels.filter((_, i) => i % Math.max(1, Math.floor(trendLabels.length / 6)) === 0), datasets: [{ data: trendValues.length > 0 ? trendValues : [0] }] }}
                  width={W}
                  height={180}
                  yAxisSuffix="%"
                  chartConfig={{ backgroundColor: '#fff', backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', decimalPlaces: 0, color: (o) => `rgba(61,139,94,${o})`, labelColor: () => colors.sand400, propsForDots: { r: '3', strokeWidth: '1', stroke: colors.green500 }, propsForBackgroundLines: { stroke: colors.sand200 } }}
                  bezier
                  style={{ borderRadius: 12, marginTop: 8 }}
                  fromZero
                />
              </View>
            )}

            {/* Mood */}
            {stats.moodHistory?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Mood & Wellness</Text>
                {stats.moodHistory.slice().reverse().slice(0, 10).map((e, i) => (
                  <View key={i} style={[styles.moodRow, i < 9 && { borderBottomWidth: 1, borderBottomColor: colors.sand200 }]}>
                    <View style={[styles.moodDot, { backgroundColor: /good/i.test(e.mood) ? colors.green500 : /okay/i.test(e.mood) ? colors.amber500 : colors.red500 }]} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.moodLabel}>{e.mood}</Text>
                        <Text style={styles.moodDate}>{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                      </View>
                      {e.complaints?.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {e.complaints.map((c, j) => <View key={j} style={styles.cTag}><Text style={styles.cTagText}>{c}</Text></View>)}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : statsLoading ? (
          <Text style={styles.loadText}>Loading stats...</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RStat({ label, value, sub, color, icon }) {
  return (
    <View style={rs.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text style={rs.label}>{label.toUpperCase()}</Text>
      </View>
      <Text style={[rs.value, { color }]}>{value}</Text>
      <Text style={rs.sub}>{sub}</Text>
    </View>
  );
}
const rs = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.sand200, minWidth: '45%' },
  label: { fontSize: 10, fontFamily: fonts.bodySemiBold, color: colors.sand400, letterSpacing: 0.5 },
  value: { fontSize: 22, fontFamily: fonts.heading, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 10, fontFamily: fonts.body, color: colors.sand400, marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand50 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.moss900, marginBottom: spacing.xl, letterSpacing: -0.5 },
  selBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.sand200 },
  selBtnActive: { backgroundColor: colors.moss800 },
  selText: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.sand400 },
  selTextActive: { color: '#fff' },
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.sand200 },
  periodBtnActive: { backgroundColor: colors.moss800 },
  periodText: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.sand400 },
  periodTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.sand200, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.moss900, marginBottom: 12 },
  medBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  medBarName: { width: 90, fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.moss900 },
  medBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.sand200, overflow: 'hidden' },
  medBarFill: { height: '100%', borderRadius: 4 },
  medBarPct: { width: 36, textAlign: 'right', fontSize: 12, fontFamily: fonts.bodyBold },
  moodRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  moodDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  moodLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.moss900, textTransform: 'capitalize' },
  moodDate: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400 },
  cTag: { backgroundColor: colors.terra200, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  cTagText: { fontSize: 10, fontFamily: fonts.body, color: colors.terra600 },
  loadText: { textAlign: 'center', padding: 60, fontFamily: fonts.body, color: colors.sand400 },
});
