import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { usersApi, patientsApi } from '../services/api';
import { colors, fonts, spacing } from '../theme';
import { HeartIcon, LogOutIcon, ShieldIcon, BellIcon } from '../components/Icons';

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [patients, setPatients] = useState([]);
  const [notifs, setNotifs] = useState({ weekly: true, daily: false, alerts: true });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (user.notificationPreferences) setNotifs(user.notificationPreferences);
    }
  }, [user]);

  useEffect(() => {
    patientsApi.list()
      .then(r => setPatients(Array.isArray(r.data) ? r.data : (r.data.data || [])))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await usersApi.update({ name, notificationPreferences: notifs });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
      if (__DEV__) console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Settings</Text>

        {/* Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            accessibilityLabel="Your name"
            accessibilityHint="Edit your display name"
          />

          <Text style={styles.label}>{user?.phone ? 'Phone' : 'Email'}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.phone || user?.email || ''}
            editable={false}
            accessibilityLabel={user?.phone ? 'Phone number' : 'Email address'}
          />

          <Text style={styles.label}>Timezone</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.timezone || 'Asia/Kolkata'}
            editable={false}
            accessibilityLabel="Timezone"
          />
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BellIcon size={16} color={colors.moss600} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
          {[
            { key: 'daily', title: 'Post-call reports', desc: 'WhatsApp message after each call' },
            { key: 'weekly', title: 'Weekly summary', desc: 'Comprehensive report every Sunday' },
            { key: 'alerts', title: 'Missed medicine alerts', desc: 'Alert when critical medicine is missed' },
          ].map(({ key, title, desc }) => (
            <View key={key} style={[styles.notifRow, key !== 'alerts' && { borderBottomWidth: 1, borderBottomColor: colors.sand200 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>{title}</Text>
                <Text style={styles.notifDesc}>{desc}</Text>
              </View>
              <Switch
                value={notifs[key]}
                onValueChange={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                trackColor={{ false: colors.sand300, true: colors.moss500 }}
                thumbColor="#fff"
                accessibilityLabel={title}
                accessibilityHint={desc}
                accessibilityRole="switch"
              />
            </View>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { backgroundColor: colors.moss400 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={saving ? 'Saving changes' : saved ? 'Changes saved' : 'Save changes'}
          accessibilityState={{ disabled: saving }}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</Text>
        </TouchableOpacity>

        {/* Subscription */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Subscription</Text>
          {patients.map(p => (
            <View key={p._id} style={styles.subRow} accessibilityLabel={`${p.preferredName || 'Patient'}: ${p.subscriptionStatus || 'trial'}`}>
              <View>
                <Text style={styles.subName}>{p.preferredName || 'Unknown'}</Text>
                <Text style={styles.subFull}>{p.fullName || ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={[styles.subBadge, { backgroundColor: p.subscriptionStatus === 'active' ? colors.moss100 : colors.amber300 }]}>
                  <Text style={[styles.subBadgeText, { color: p.subscriptionStatus === 'active' ? colors.green500 : colors.moss900 }]}>{p.subscriptionStatus || 'trial'}</Text>
                </View>
                {p.trialEndsAt && p.subscriptionStatus === 'trial' && (
                  <Text style={styles.subExpiry}>Ends {new Date(p.trialEndsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOutIcon size={18} color={colors.terra600} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <HeartIcon size={14} color={colors.terra400} fill={colors.terra400} />
          <Text style={styles.footerText}>CoCarely v1.0</Text>
          <ShieldIcon size={12} color={colors.sand300} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.sand50 },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  title: { fontFamily: fonts.heading, fontSize: 26, color: colors.moss900, marginBottom: 24, letterSpacing: -0.5 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: colors.sand200, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.moss900, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.sand400, marginBottom: 6 },
  input: { backgroundColor: colors.sand50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.sand200, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: fonts.body, color: colors.moss900, marginBottom: 16 },
  inputDisabled: { backgroundColor: colors.sand100, color: colors.sand400 },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  notifTitle: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  notifDesc: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  saveBtn: { backgroundColor: colors.moss800, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: fonts.bodySemiBold },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.sand200 },
  subName: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.moss900 },
  subFull: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
  subBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  subBadgeText: { fontSize: 11, fontFamily: fonts.bodySemiBold },
  subExpiry: { fontSize: 10, fontFamily: fonts.body, color: colors.sand400, marginTop: 3 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.terra200, borderWidth: 1.5, borderColor: colors.terra300, borderRadius: 14, paddingVertical: 14, marginBottom: 24 },
  logoutText: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.terra600 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingBottom: 20 },
  footerText: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
});
