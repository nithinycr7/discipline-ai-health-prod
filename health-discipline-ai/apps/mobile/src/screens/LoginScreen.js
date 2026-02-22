import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts, spacing, radius } from '../theme';
import { HeartIcon, PhoneIcon, ShieldIcon } from '../components/Icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+919876543210');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!phone.trim()) return setError('Please enter your phone number');
    setLoading(true);
    setError('');
    try {
      await login(phone.trim());
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.moss800, colors.moss700, colors.moss600]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Logo & Tagline */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <HeartIcon size={22} color={colors.terra300} fill={colors.terra300} />
              </View>
              <Text style={styles.logoText}>CoCarely</Text>
            </View>
            <Text style={styles.headline}>Care for your{'\n'}parents, from{'\n'}anywhere</Text>
            <Text style={styles.subtitle}>AI-powered daily calls to ensure your loved ones never miss their medicines.</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in with your registered phone number</Text>

            <View style={styles.inputWrap}>
              <PhoneIcon size={18} color={colors.sand400} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.sand400}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.secureRow}>
              <ShieldIcon size={14} color={colors.sand400} />
              <Text style={styles.secureText}>Your data is encrypted and secure</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'space-between' },
  header: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  logoText: { fontFamily: fonts.heading, fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  headline: { fontFamily: fonts.headingMedium, fontSize: 32, color: '#fff', lineHeight: 40, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: fonts.body, color: 'rgba(255,255,255,0.65)', lineHeight: 22, maxWidth: 300 },
  card: { backgroundColor: colors.sand50, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl, paddingBottom: 40 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.moss900, marginBottom: 6 },
  cardSubtitle: { fontSize: 14, fontFamily: fonts.body, color: colors.sand400, marginBottom: 28 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 2, borderColor: colors.sand200, paddingHorizontal: 16, paddingVertical: 14, gap: 10, marginBottom: 16 },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.body, color: colors.moss900 },
  error: { color: colors.red500, fontSize: 13, fontFamily: fonts.body, marginBottom: 12, paddingLeft: 4 },
  btn: { backgroundColor: colors.moss800, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  btnDisabled: { backgroundColor: colors.moss400 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: fonts.bodySemiBold },
  secureRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  secureText: { fontSize: 12, fontFamily: fonts.body, color: colors.sand400 },
});
