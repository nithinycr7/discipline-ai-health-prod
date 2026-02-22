import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { patientsApi, medicinesApi, callsApi } from '../services/api';
import { colors, fonts, spacing } from '../theme';
import { ArrowLeftIcon, FlameIcon, ChevronRightIcon } from '../components/Icons';

const W = Dimensions.get('window').width - 72;
const tabs = ['Overview', 'Today', 'Calendar', 'Calls', 'Meds'];

export default function PatientDetailScreen({ route, navigation }) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [calls, setCalls] = useState([]);
  const [callsTotal, setCallsTotal] = useState(0);
  const [callsPage, setCallsPage] = useState(1);
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [days, setDays] = useState(30);

  const loadAll = useCallback(async () => {
    try {
      const [pR, mR, aR, cR, calR, sR] = await Promise.all([
        patientsApi.get(patientId),
        medicinesApi.list(patientId),
        patientsApi.adherenceToday(patientId).catch(() => null),
        callsApi.list(patientId, 1, 8).catch(() => ({ data: { data: { calls: [], total: 0 } } })),
        patientsApi.adherenceCalendar(patientId, new Date().toISOString().slice(0, 7)).catch(() => null),
        patientsApi.stats(patientId, days).catch(() => null),
      ]);
      setPatient(pR.data.data || pR.data);
      setMedicines(Array.isArray(mR.data) ? mR.data : (mR.data.data || []));
      setAdherence(aR?.data);
      const cd = cR.data;
      setCalls(cd?.calls || cd?.data?.calls || []);
      setCallsTotal(cd?.total || cd?.data?.total || 0);
      setCalendar(calR?.data);
      setStats(sR?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [patientId, days]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    patientsApi.stats(patientId, days).then(r => setStats(r.data)).catch(() => {});
  }, [patientId, days]);

  const loadCallsPage = async (pg) => {
    try {
      const r = await callsApi.list(patientId, pg, 8);
      const d = r.data;
      setCalls(d?.calls || d?.data?.calls || []);
      setCallsTotal(d?.total || d?.data?.total || 0);
      setCallsPage(pg);
    } catch (e) { console.error(e); }
  };

  if (loading || !patient) return <View style={styles.loaderWrap}><Text style={styles.loaderText}>Loading...</Text></View>;

  const pctColor = (v) => v >= 80 ? colors.green500 : v >= 50 ? colors.amber500 : colors.red500;
  const totalPages = Math.ceil(callsTotal / 8);

  // Chart data
  const trendData = stats?.adherenceTrend?.slice(-14) || [];
  const trendLabels = trendData.map(d => { const dt = new Date(d.date); return `${dt.getDate()}/${dt.getMonth() + 1}`; });
  const trendValues = trendData.map(d => d.adherencePercentage);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={18} color={colors.moss600} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: patient.isPaused ? colors.sand200 : colors.moss100 }]}>
            <Text style={[styles.avatarText, { color: patient.isPaused ? colors.sand400 : colors.moss700 }]}>{patient.preferredName?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={styles.patientName}>{patient.preferredName}</Text>
              {patient.currentStreak > 0 && (
                <View style={styles.streakBadge}><FlameIcon size={12} color={colors.terra600} /><Text style={styles.streakVal}>{patient.currentStreak}</Text></View>
              )}
              {patient.isPaused && <View style={styles.pauseBadge}><Text style={styles.pauseText}>Paused</Text></View>}
            </View>
            <Text style={styles.patientSub}>{patient.fullName} · Age {patient.age} · {patient.healthConditions?.join(', ')}</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <View>
            <View style={styles.miniStatsGrid}>
              <MiniStat label="Today" value={adherence ? `${adherence.adherencePercentage}%` : '--'} sub={adherence ? `${adherence.taken}/${adherence.totalMedicines} meds` : 'No call'} color={adherence?.adherencePercentage >= 80 ? colors.green500 : colors.amber500} />
              <MiniStat label="Streak" value={`${patient.currentStreak || 0}`} sub={`Best: ${patient.longestStreak || 0}d`} color={colors.terra500} />
              <MiniStat label="Calls" value={stats?.callStats?.completed || 0} sub={`${stats?.callStats?.noAnswer || 0} missed`} color={colors.moss700} />
              <MiniStat label="Mood" value={adherence?.moodNotes || '--'} sub="today" color={colors.green500} capitalize />
            </View>

            <View style={styles.periodRow}>
              {[7, 14, 30].map(d => (
                <TouchableOpacity key={d} style={[styles.periodBtn, days === d && styles.periodBtnActive]} onPress={() => setDays(d)}>
                  <Text style={[styles.periodText, days === d && styles.periodTextActive]}>{d}D</Text>
                </TouchableOpacity>
              ))}
            </View>

            {trendValues.length > 1 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Adherence Trend</Text>
                <Text style={styles.chartSub}>Daily compliance over {days} days</Text>
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

            {stats?.perMedicineAdherence?.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Per-Medicine Compliance</Text>
                {stats.perMedicineAdherence.map((m, i) => (
                  <View key={i} style={styles.medBar}>
                    <Text style={styles.medBarName} numberOfLines={1}>{m.name}</Text>
                    <View style={styles.medBarTrack}>
                      <View style={[styles.medBarFill, { width: `${m.percentage}%`, backgroundColor: pctColor(m.percentage) }]} />
                    </View>
                    <Text style={[styles.medBarPct, { color: pctColor(m.percentage) }]}>{m.percentage}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TODAY */}
        {tab === 'Today' && (
          <View>
            {adherence ? (
              <>
                <View style={styles.miniStatsGrid}>
                  <MiniStat label="Adherence" value={`${adherence.adherencePercentage}%`} sub={`${adherence.taken}/${adherence.totalMedicines}`} color={pctColor(adherence.adherencePercentage)} />
                  {adherence.vitals?.glucose && <MiniStat label="Glucose" value={adherence.vitals.glucose} sub="mg/dL" color={colors.moss700} />}
                  {adherence.moodNotes && <MiniStat label="Mood" value={adherence.moodNotes} sub="today" color={colors.green500} capitalize />}
                </View>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Medicine Checklist</Text>
                  {adherence.medicineDetails?.map((med, i) => (
                    <View key={i} style={[styles.medRow, i < adherence.medicineDetails.length - 1 && styles.medRowBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        {med.nickname && med.nickname !== med.name && <Text style={styles.medNick}>"{med.nickname}"</Text>}
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: med.status === 'taken' ? colors.moss100 : med.status === 'missed' ? colors.terra200 : colors.sand200 }]}>
                        <Text style={[styles.statusPillText, { color: med.status === 'taken' ? colors.green500 : med.status === 'missed' ? colors.red500 : colors.sand400 }]}>{med.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                {adherence.complaints?.length > 0 && (
                  <View style={styles.complaintsBox}>
                    <Text style={styles.complaintsTitle}>Complaints Reported</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {adherence.complaints.map((c, i) => <View key={i} style={styles.complaintTag}><Text style={styles.complaintText}>{c}</Text></View>)}
                    </View>
                  </View>
                )}
              </>
            ) : <Text style={styles.empty}>No data for today yet.</Text>}
          </View>
        )}

        {/* CALENDAR */}
        {tab === 'Calendar' && (
          <View>
            {calendar ? (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Monthly Adherence</Text>
                <Text style={styles.chartSub}>Overall: {calendar.monthlyAdherence}%</Text>
                <View style={styles.calGrid}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <View key={i} style={styles.calDayHeader}><Text style={styles.calDayHeaderText}>{d}</Text></View>
                  ))}
                  {calendar.days?.map((day) => {
                    const date = new Date(day.date + 'T00:00:00');
                    const dayOfWeek = date.getDay();
                    const isFirst = date.getDate() === 1;
                    const bg = day.status === 'full' ? colors.green500 : day.status === 'partial' ? colors.amber500 : day.status === 'missed' ? colors.red500 : colors.sand200;
                    const cl = (day.status === 'no_call' || day.status === 'no_data') ? colors.sand400 : '#fff';
                    const spacers = isFirst ? Array(dayOfWeek).fill(null).map((_, i) => <View key={`s${i}`} style={styles.calCell} />) : [];
                    return [
                      ...spacers,
                      <View key={day.date} style={[styles.calCell, { backgroundColor: bg }]}>
                        <Text style={[styles.calCellText, { color: cl }]}>{date.getDate()}</Text>
                      </View>
                    ];
                  })}
                </View>
                <View style={styles.calLegend}>
                  {[['Full', colors.green500], ['Partial', colors.amber500], ['Missed', colors.red500], ['No call', colors.sand200]].map(([l, c]) => (
                    <View key={l} style={styles.calLegendItem}>
                      <View style={[styles.calLegendDot, { backgroundColor: c }]} />
                      <Text style={styles.calLegendText}>{l}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : <Text style={styles.empty}>No calendar data.</Text>}
          </View>
        )}

        {/* CALLS */}
        {tab === 'Calls' && (
          <View style={styles.chartCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.chartTitle}>Call History</Text>
              {callsTotal > 0 && <Text style={styles.chartSub}>{callsTotal} total</Text>}
            </View>
            {calls.map((c, i) => (
              <View key={c._id} style={[styles.callRow, i < calls.length - 1 && styles.callRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.callDate}>{new Date(c.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  <Text style={styles.callMeta}>
                    {c.duration ? `${Math.floor(c.duration / 60)}m ${c.duration % 60}s` : 'N/A'}
                    {c.medicinesChecked?.length > 0 && ` · ${c.medicinesChecked.filter(m => m.response === 'taken').length}/${c.medicinesChecked.length} taken`}
                  </Text>
                </View>
                <View style={[styles.callBadge, { backgroundColor: c.status === 'completed' ? colors.moss100 : colors.amber300 }]}>
                  <Text style={[styles.callBadgeText, { color: c.status === 'completed' ? colors.green500 : colors.moss900 }]}>{c.status?.replace('_', ' ')}</Text>
                </View>
              </View>
            ))}
            {calls.length === 0 && <Text style={styles.empty}>No calls yet</Text>}
            {totalPages > 1 && (
              <View style={styles.pagRow}>
                <Text style={styles.pagText}>Page {callsPage}/{totalPages}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.pagBtn, callsPage <= 1 && { opacity: 0.4 }]} disabled={callsPage <= 1} onPress={() => loadCallsPage(callsPage - 1)}>
                    <Text style={styles.pagBtnText}>Prev</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.pagBtn, callsPage >= totalPages && { opacity: 0.4 }]} disabled={callsPage >= totalPages} onPress={() => loadCallsPage(callsPage + 1)}>
                    <Text style={styles.pagBtnText}>Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* MEDS */}
        {tab === 'Meds' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Medicines ({medicines.length})</Text>
            {medicines.map((med, i) => (
              <View key={med._id} style={[styles.medDetailRow, i < medicines.length - 1 && styles.medRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{med.brandName}</Text>
                  {med.genericName && <Text style={styles.medGeneric}>{med.genericName}</Text>}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    <View style={[styles.medTag, { backgroundColor: colors.moss100 }]}><Text style={[styles.medTagText, { color: colors.moss700 }]}>{med.timing}</Text></View>
                    <View style={[styles.medTag, { backgroundColor: colors.sand200 }]}><Text style={[styles.medTagText, { color: colors.sand400 }]}>{med.foodPreference} food</Text></View>
                    {med.nicknames?.length > 0 && <View style={[styles.medTag, { backgroundColor: colors.terra200 }]}><Text style={[styles.medTagText, { color: colors.terra600, fontStyle: 'italic' }]}>"{med.nicknames[0]}"</Text></View>}
                  </View>
                </View>
                {med.isCritical && <View style={styles.critBadge}><Text style={styles.critText}>Critical</Text></View>}
              </View>
            ))}
            {medicines.length === 0 && <Text style={styles.empty}>No medicines</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, sub, color, capitalize }) {
  return (
    <View style={ms.card}>
      <Text style={ms.label}>{label.toUpperCase()}</Text>
      <Text style={[ms.value, { color, textTransform: capitalize ? 'capitalize' : 'none' }]}>{value}</Text>
      <Text style={ms.sub}>{sub}</Text>
    </View>
  );
}
const ms = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.sand200, minWidth: '45%' },
  label: { fontSize: 10, fontFamily: fonts.bodySemiBold, color: colors.sand400, letterSpacing: 0.5 },
  value: { fontSize: 22, fontFamily: fonts.heading, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 10, fontFamily: fonts.body, color: colors.sand400, marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand50 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.sand50 },
  loaderText: { fontFamily: fonts.body, color: colors.sand400 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.moss600 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.xl },
  avatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontFamily: fonts.bodyBold },
  patientName: { fontFamily: fonts.heading, fontSize: 22, color: colors.moss900 },
  patientSub: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.terra200 },
  streakVal: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.terra600 },
  pauseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.amber300 },
  pauseText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  tabScroll: { marginBottom: spacing.xl },
  tabRow: { flexDirection: 'row', gap: 6 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.sand200 },
  tabBtnActive: { backgroundColor: colors.moss800 },
  tabText: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.sand400 },
  tabTextActive: { color: '#fff' },
  miniStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl },
  periodRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.sand200 },
  periodBtnActive: { backgroundColor: colors.moss800 },
  periodText: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.sand400 },
  periodTextActive: { color: '#fff' },
  chartCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.sand200, marginBottom: 16 },
  chartTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.moss900, marginBottom: 4 },
  chartSub: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400, marginBottom: 8 },
  medBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  medBarName: { width: 90, fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.moss900 },
  medBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.sand200, overflow: 'hidden' },
  medBarFill: { height: '100%', borderRadius: 4 },
  medBarPct: { width: 36, textAlign: 'right', fontSize: 12, fontFamily: fonts.bodyBold },
  medRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  medRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.sand200 },
  medName: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  medNick: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400, fontStyle: 'italic' },
  medGeneric: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontFamily: fonts.bodySemiBold },
  complaintsBox: { backgroundColor: colors.terra200, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.terra300, marginTop: 12 },
  complaintsTitle: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.terra600, marginBottom: 8 },
  complaintTag: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  complaintText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.terra600 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 12 },
  calDayHeader: { width: `${100 / 7 - 1.5}%`, alignItems: 'center', padding: 6 },
  calDayHeaderText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.sand400 },
  calCell: { width: `${100 / 7 - 1.5}%`, aspectRatio: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  calCellText: { fontSize: 12, fontFamily: fonts.bodySemiBold },
  calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 14 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calLegendDot: { width: 10, height: 10, borderRadius: 3 },
  calLegendText: { fontSize: 10, fontFamily: fonts.body, color: colors.sand400 },
  callRow: { paddingVertical: 12 },
  callRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.sand200 },
  callDate: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  callMeta: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400, marginTop: 2 },
  callBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  callBadgeText: { fontSize: 10, fontFamily: fonts.bodySemiBold },
  pagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.sand200 },
  pagText: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  pagBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.sand200, backgroundColor: '#fff' },
  pagBtnText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.moss900 },
  medDetailRow: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  medTag: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  medTagText: { fontSize: 10, fontFamily: fonts.bodyMedium },
  critBadge: { backgroundColor: colors.terra200, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  critText: { fontSize: 10, fontFamily: fonts.bodySemiBold, color: colors.red500 },
  empty: { textAlign: 'center', padding: 60, fontFamily: fonts.body, color: colors.sand400, fontSize: 13 },
});
