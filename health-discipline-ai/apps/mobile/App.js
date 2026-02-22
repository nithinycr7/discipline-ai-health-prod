import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.moss500} />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium: require('./assets/fonts/Fraunces-Medium.ttf'),
    Fraunces_600SemiBold: require('./assets/fonts/Fraunces-SemiBold.ttf'),
    Manrope_400Regular: require('./assets/fonts/Manrope-Regular.ttf'),
    Manrope_500Medium: require('./assets/fonts/Manrope-Medium.ttf'),
    Manrope_600SemiBold: require('./assets/fonts/Manrope-SemiBold.ttf'),
    Manrope_700Bold: require('./assets/fonts/Manrope-Bold.ttf'),
  });

  const onLayoutReady = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutReady}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.sand50 },
});
