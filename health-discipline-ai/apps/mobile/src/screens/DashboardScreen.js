import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { patientsApi } from '../services/api';
import { colors, fonts, spacing } from '../theme';
import { HeartIcon, TrendUpIcon, FlameIcon, AlertIcon, ChevronRightIcon } from '../components/Icons';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await patientsApi.list();
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      const withAdh = await Promise.all(
        list.map(async (p) => {
          try {
            const a = await patientsApi.adherenceToday(p._id);
            return { ...p, adherence: a.data };
          } catch { return p; }
        })
      );
      setPatients(withAdh);
    } catch (e) {
      setError('Unable to load dashboard. Pull down to retry.');
      if (__DEV__) console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh stale data when screen regains focus
  useFocusEffect(
    useCallback(() => {
      if (!loading) loadData();
    }, [loading, loadData])
  );

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const activePatients = patients.filter(p => !p.isPaused);
  const avgAdh = activePatients.length > 0
    ? Math.round(activePatients.reduce((s, p) => s + (p.adherence?.adherencePercentage || 0), 0) / activePatients.length) : 0;
  const streaks = patients.filter(p => (p.currentStreak || 0) >= 7).length;

  const alerts = [];
  patients.forEach(p => {
    if (p.isPaused) return;
    const pct = p.adherence?.adherencePercentage;
    if (pct !== undefined && pct < 50 && (p.adherence?.totalMedicines || 0) > 0)
      alerts.push({ patient: p, reason: `Only ${pct}% adherence today`, key: `adh-${p._id}` });
    if (p.subscriptionStatus === 'trial' && p.trialEndsAt) {
      const d = Math.ceil((new Date(p.trialEndsAt).getTime() - Date.now()) / 86400000);
      if (d >= 0 && d <= 3) alerts.push({ patient: p, reason: `Trial expires in ${d}d`, key: `trial-${p._id}` });
    }
    if (p.adherence?.complaints?.length > 0) alerts.push({ patient: p, reason: p.adherence.complaints.join(', '), key: `comp-${p._id}` });
  });

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const pctColor = (v) => v >= 80 ? colors.green500 : v >= 50 ? colors.amber500 : colors.red500;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.moss500} />
          <Text style={styles.loaderText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss500} />}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name} accessibilityRole="header">{firstName}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.heartWrap} accessibilityLabel="CoCarely">
            <HeartIcon size={20} color={colors.moss600} fill={colors.moss300} />
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard} accessibilityLabel={`Average adherence ${activePatients.some(p => p.adherence?.totalMedicines) ? `${avgAdh} percent` : 'no data'}`}>
            <View style={styles.statIconRow}><TrendUpIcon size={14} color={colors.sand400} /><Text style={styles.statLabel}>AVG ADHERENCE</Text></View>
            <Text style={[styles.statValue, { color: activePatients.some(p => p.adherence?.totalMedicines) ? pctColor(avgAdh) : colors.sand400 }]}>{activePatients.some(p => p.adherence?.totalMedicines) ? `${avgAdh}%` : '--'}</Text>
            <Text style={styles.statSub}>across all patients</Text>
          </View>
          <View style={styles.statCard} accessibilityLabel={`${streaks} active streaks of 7 or more days`}>
            <View style={styles.statIconRow}><FlameIcon size={14} color={colors.sand400} /><Text style={styles.statLabel}>ACTIVE STREAKS</Text></View>
            <Text style={[styles.statValue, { color: colors.terra500 }]}>{streaks}</Text>
            <Text style={styles.statSub}>7+ day streaks</Text>
          </View>
        </View>

        {/* Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertBox} accessibilityRole="alert" accessibilityLabel={`${alerts.length} items need attention`}>
            <View style={styles.alertHeader}><AlertIcon size={14} color={colors.terra600} /><Text style={styles.alertTitle}>NEEDS ATTENTION</Text></View>
            {alerts.map((a) => (
              <TouchableOpacity
                key={a.key}
                style={styles.alertItem}
                onPress={() => navigation.navigate('PatientDetailFromHome', { patientId: a.patient._id })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${a.patient.preferredName || 'Patient'}: ${a.reason}`}
              >
                <View style={styles.alertAvatar}><Text style={styles.alertAvatarText}>{(a.patient.preferredName || '?').charAt(0)}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertName}>{a.patient.preferredName || 'Unknown'}</Text>
                  <Text style={styles.alertReason}>{a.reason}</Text>
                </View>
                <ChevronRightIcon size={16} color={colors.terra500} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Patient Cards */}
        <Text style={styles.sectionTitle}>Your Family</Text>
        {patients.length === 0 && !error && (
          <Text style={styles.emptyText}>No patients added yet.</Text>
        )}
        {patients.map((p) => {
          const pct = p.adherence?.adherencePercentage || 0;
          const taken = p.adherence?.taken || 0;
          const total = p.adherence?.totalMedicines || 0;
          const badgeInfo = p.isPaused
            ? { t: 'Paused', bg: colors.sand200, c: colors.sand400 }
            : pct === 100 ? { t: 'All Taken', bg: colors.moss100, c: colors.green500 }
            : pct > 0 ? { t: 'Partial', bg: colors.amber300, c: colors.moss900 }
            : total > 0 ? { t: 'Missed', bg: colors.terra200, c: colors.red500 }
            : { t: 'No calls', bg: colors.sand200, c: colors.sand400 };

          return (
            <TouchableOpacity
              key={p._id}
              style={styles.patientCard}
              onPress={() => navigation.navigate('PatientDetailFromHome', { patientId: p._id })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${p.preferredName || 'Patient'}, ${badgeInfo.t}${total > 0 && !p.isPaused ? `, ${taken} of ${total} medicines taken` : ''}`}
            >
              <View style={styles.patientTop}>
                <View style={[styles.avatar, { backgroundColor: p.isPaused ? colors.sand200 : colors.moss100 }]}>
                  <Text style={[styles.avatarText, { color: p.isPaused ? colors.sand400 : colors.moss700 }]}>{(p.preferredName || '?').charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.patientName}>{p.preferredName || 'Unknown'}</Text>
                    {(p.currentStreak || 0) > 0 && (
                      <View style={styles.streakBadge} accessibilityLabel={`${p.currentStreak} day streak`}>
                        <FlameIcon size={10} color={colors.terra600} /><Text style={styles.streakText}>{p.currentStreak}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.patientSub}>{p.fullName || ''}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeInfo.bg }]}><Text style={[styles.badgeText, { color: badgeInfo.c }]}>{badgeInfo.t}</Text></View>
              </View>

              {total > 0 && !p.isPaused && (
                <View style={styles.progressArea} accessibilityLabel={`${pct} percent adherence, ${taken} of ${total} medicines taken`}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabel}>{taken}/{total} medicines taken</Text>
                    <Text style={[styles.progressPct, { color: pctColor(pct) }]}>{pct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pctColor(pct) }]} />
                  </View>
                </View>
              )}

              {p.adherence?.moodNotes && (
                <View style={styles.moodRow}>
                  <View style={[styles.moodDot, { backgroundColor: /good/i.test(p.adherence.moodNotes) ? colors.green500 : /okay/i.test(p.adherence.moodNotes) ? colors.amber500 : colors.red500 }]} />
                  <Text style={styles.moodText}>Feeling {p.adherence.moodNotes}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand50 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loaderText: { fontFamily: fonts.body, color: colors.sand400, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  greeting: { fontSize: 13, color: colors.sand400, fontFamily: fonts.bodyMedium },
  name: { fontFamily: fonts.heading, fontSize: 26, color: colors.moss900, letterSpacing: -0.5 },
  date: { fontSize: 13, color: colors.sand400, fontFamily: fonts.body, marginTop: 2 },
  heartWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.moss100, justifyContent: 'center', alignItems: 'center' },
  errorBanner: { backgroundColor: colors.terra200, borderRadius: 14, padding: 14, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.terra300 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: colors.terra600, textAlign: 'center' },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.sand400, textAlign: 'center', padding: 40 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.xl },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.sand200 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statLabel: { fontSize: 10, fontFamily: fonts.bodySemiBold, color: colors.sand400, letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontFamily: fonts.heading, letterSpacing: -0.5 },
  statSub: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400, marginTop: 2 },
  alertBox: { backgroundColor: colors.terra200, borderRadius: 20, padding: 16, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.terra300 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertTitle: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.terra600, letterSpacing: 0.5 },
  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 10, gap: 10, marginBottom: 8 },
  alertAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.terra300, justifyContent: 'center', alignItems: 'center' },
  alertAvatarText: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.terra600 },
  alertName: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  alertReason: { fontSize: 11, fontFamily: fonts.body, color: colors.terra600 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.moss900, marginBottom: 12 },
  patientCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.sand200, marginBottom: 12 },
  patientTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 17, fontFamily: fonts.bodyBold },
  patientName: { fontFamily: fonts.heading, fontSize: 17, color: colors.moss900 },
  patientSub: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.terra200 },
  streakText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.terra600 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: fonts.bodySemiBold },
  progressArea: { marginTop: 14 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  progressPct: { fontSize: 14, fontFamily: fonts.bodyBold },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.sand200, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodText: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400, textTransform: 'capitalize' },
});
