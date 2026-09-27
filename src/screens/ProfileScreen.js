import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resetRoot } from '../navigation/navigationRef';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    // Reset the whole navigation stack to Login so Back cannot return here.
    resetRoot('Login');
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role === 'manager' ? 'Restaurant Manager' : 'Customer'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Row label="Full name" value={user.fullName} styles={styles} />
        <Row label="Email" value={user.email} styles={styles} />
        <Row label="Role" value={user.role} styles={styles} />
        {user.phone ? <Row label="Phone" value={user.phone} styles={styles} last /> : null}
      </View>

      <View style={[styles.card, styles.switchRow]}>
        <View>
          <Text style={styles.rowValue}>Dark mode</Text>
          <Text style={styles.rowLabel}>{isDark ? 'On' : 'Off'} for the whole app</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.disabled, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value, styles, last }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
    header: { alignItems: 'center', marginVertical: 16 },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: c.onPrimary, fontSize: 30, fontWeight: '700' },
    name: { color: c.text, fontSize: 22, fontWeight: '700', marginTop: 10 },
    roleBadge: { backgroundColor: c.subtle, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6 },
    roleText: { color: c.text, fontSize: 12, fontWeight: '600' },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { color: c.textMuted, fontSize: 12 },
    rowValue: { color: c.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    logoutButton: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
    },
    logoutText: { color: c.danger, fontWeight: '700', fontSize: 15 },
  });
