import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientsApi } from '../services/api';
import { colors, fonts, spacing, radius } from '../theme';
import { SearchIcon, FlameIcon, ChevronRightIcon } from '../components/Icons';

export default function PatientsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await patientsApi.list();
      setPatients(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.preferredName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.moss500} />}>

        <Text style={styles.title}>Patients</Text>

        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={colors.sand400} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search patients..." placeholderTextColor={colors.sand400} />
        </View>

        {filtered.map((p) => (
          <TouchableOpacity key={p._id} style={styles.card} onPress={() => navigation.navigate('PatientDetail', { patientId: p._id })} activeOpacity={0.7}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: p.isPaused ? colors.sand200 : colors.moss100 }]}>
                <Text style={[styles.avatarText, { color: p.isPaused ? colors.sand400 : colors.moss700 }]}>{p.preferredName?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.name}>{p.preferredName}</Text>
                  {(p.currentStreak || 0) > 0 && (
                    <View style={styles.streakBadge}><FlameIcon size={9} color={colors.terra600} /><Text style={styles.streakVal}>{p.currentStreak}</Text></View>
                  )}
                </View>
                <Text style={styles.sub} numberOfLines={1}>{p.fullName} · Age {p.age} · {p.preferredLanguage?.toUpperCase()}</Text>
                <View style={styles.tags}>
                  {p.healthConditions?.map(c => <View key={c} style={styles.tag}><Text style={styles.tagText}>{c}</Text></View>)}
                </View>
              </View>
              <View style={styles.rightCol}>
                <View style={[styles.statusBadge, { backgroundColor: p.isPaused ? colors.sand200 : colors.moss100 }]}>
                  <Text style={[styles.statusText, { color: p.isPaused ? colors.sand400 : colors.green500 }]}>{p.isPaused ? 'Paused' : 'Active'}</Text>
                </View>
                <Text style={styles.callCount}>{p.callsCompletedCount} calls</Text>
              </View>
              <ChevronRightIcon size={18} color={colors.sand300} />
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && !loading && (
          <Text style={styles.empty}>{search ? 'No patients match your search' : 'No patients added yet'}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand50 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.moss900, marginBottom: spacing.xl, letterSpacing: -0.5 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: colors.sand200, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: spacing.xl },
  searchInput: { flex: 1, fontSize: 15, fontFamily: fonts.body, color: colors.moss900 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.sand200, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontFamily: fonts.bodyBold },
  name: { fontFamily: fonts.heading, fontSize: 16, color: colors.moss900 },
  sub: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { backgroundColor: colors.sand200, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.sand400 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: colors.terra200 },
  streakVal: { fontSize: 10, fontFamily: fonts.bodyBold, color: colors.terra600 },
  rightCol: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: fonts.bodySemiBold },
  callCount: { fontSize: 11, fontFamily: fonts.body, color: colors.sand400, marginTop: 4 },
  empty: { textAlign: 'center', padding: 60, color: colors.sand400, fontFamily: fonts.body, fontSize: 14 },
});
