import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../theme';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: send to error reporting service (Sentry, Bugsnag, etc.)
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.emoji}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.debug}>{this.state.error.toString()}</Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleRetry}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.sand50,
    padding: spacing.xxl,
  },
  emoji: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: colors.terra600,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.terra200,
    textAlign: 'center',
    lineHeight: 56,
    marginBottom: 20,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.moss900,
    marginBottom: 8,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.sand400,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  debug: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.red500,
    backgroundColor: colors.terra200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  button: {
    backgroundColor: colors.moss800,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
  },
});
