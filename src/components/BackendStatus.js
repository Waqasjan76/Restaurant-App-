import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const REFRESH_INTERVAL_MS = 10000;

export default function BackendStatus() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [status, setStatus] = useState({ state: 'checking', message: 'Checking backend…' });

  const checkHealth = useCallback(async () => {
    setStatus((current) =>
      current.state === 'connected'
        ? current
        : { state: 'checking', message: 'Checking backend…' }
    );
    try {
      const health = await api.getHealth();
      if (health.api !== 'OK') throw new Error('The backend health check failed.');
      if (health.database !== 'Connected') {
        setStatus({ state: 'disconnected', message: 'Backend connected · Database disconnected' });
        return;
      }
      const demoSuffix = health.databaseMode === 'in-memory demo' ? ' (demo; resets on restart)' : '';
      setStatus({
        state: 'connected',
        message: `Backend connected · Database connected${demoSuffix}`,
      });
    } catch {
      setStatus({ state: 'unavailable', message: 'Backend unavailable · Tap to retry' });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isChecking = status.state === 'checking';
  const indicatorStyle =
    status.state === 'connected'
      ? styles.connected
      : status.state === 'checking'
        ? styles.checking
        : styles.disconnected;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={status.message}
      onPress={checkHealth}
      style={[styles.container, indicatorStyle]}
    >
      {isChecking ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
      <Text style={styles.text}>{status.message}</Text>
    </Pressable>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 12,
      marginBottom: 4,
    },
    connected: { backgroundColor: colors.success + '20' },
    checking: { backgroundColor: colors.subtle },
    disconnected: { backgroundColor: colors.danger + '20' },
    text: { color: colors.text, fontSize: 12, fontWeight: '600' },
  });
