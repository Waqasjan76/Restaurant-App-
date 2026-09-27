import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authenticate, registerUser, toPublicUser } from '../data/users';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validateAuth } from '../utils/validation';
import useForm from '../hooks/useForm';
import { showAlert } from '../utils/alert';

const EMPTY_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

export default function LoginScreen({ navigation }) {
  const { accounts, login, register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // UI mode: 'login' or 'signup'
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === 'signup';

  // Form values, errors, submit flag and validation now come from useForm.
  const validate = useCallback((v) => validateAuth(v, mode), [mode]);
  const { values, errors, handleChange, handleSubmit, reset, isSubmitting } = useForm(EMPTY_FORM, validate);

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    reset({ ...EMPTY_FORM, email: values.email });
  };

  const submit = handleSubmit(async (formValues) => {
    try {
      let user;
      if (isSignup) {
        const created = await registerUser({ ...formValues, role }, accounts);
        register(created);
        user = toPublicUser(created);
      } else {
        user = await authenticate(formValues.email, formValues.password, accounts);
      }
      // Store the user globally, then replace the auth stack with the app.
      // MainTabs opens on Menu for customers and Dashboard for managers.
      login(user);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      showAlert(isSignup ? 'Signup failed' : 'Login failed', e.message);
    }
  });

  const renderField = (field, label, props = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={values[field]}
        onChangeText={handleChange(field)}
        placeholderTextColor={colors.textMuted}
        editable={!isSubmitting}
        {...props}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🍽️</Text>
          <Text style={styles.title}>{isSignup ? 'Create an account' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>
            {isSignup ? 'Sign up to order food and book tables.' : 'Log in to browse the menu and order.'}
          </Text>

          {isSignup && renderField('fullName', 'Full name', { placeholder: 'e.g. Ayesha Khan' })}
          {renderField('email', 'Email', {
            placeholder: 'you@example.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoCorrect: false,
          })}
          {renderField('password', 'Password', {
            placeholder: 'At least 8 characters, 1 digit',
            onSubmitEditing: submit,
            secureTextEntry: !showPassword,
            autoCapitalize: 'none',
          })}
          {isSignup &&
            renderField('confirmPassword', 'Confirm password', {
              placeholder: 'Repeat your password',
              onSubmitEditing: submit,
              secureTextEntry: !showPassword,
              autoCapitalize: 'none',
            })}

          <Pressable onPress={() => setShowPassword((s) => !s)} style={styles.toggleRow}>
            <Text style={styles.link}>{showPassword ? '🙈 Hide password' : '👁️ Show password'}</Text>
          </Pressable>

          {isSignup && (
            <View style={styles.field}>
              <Text style={styles.label}>I am a</Text>
              <View style={styles.roleRow}>
                {['customer', 'manager'].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setRole(r)}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                  >
                    <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                      {r === 'customer' ? 'Customer' : 'Manager'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{isSignup ? 'Sign up' : 'Log in'}</Text>
            )}
          </Pressable>

          <Pressable onPress={switchMode} disabled={isSubmitting}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.link}>{isSignup ? 'Log in' : 'Sign up'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    container: { padding: 24, paddingTop: 32, maxWidth: 480, width: '100%', alignSelf: 'center' },
    logo: { fontSize: 48, textAlign: 'center' },
    title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 8, color: c.text },
    subtitle: { fontSize: 14, textAlign: 'center', color: c.textMuted, marginBottom: 24, marginTop: 4 },
    field: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      backgroundColor: c.input,
      color: c.text,
    },
    inputError: { borderColor: c.danger },
    errorText: { color: c.danger, fontSize: 12, marginTop: 4 },
    toggleRow: { alignSelf: 'flex-end', marginBottom: 12 },
    link: { color: c.primary, fontWeight: '600' },
    roleRow: { flexDirection: 'row', gap: 10 },
    roleChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    roleChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    roleText: { color: c.text, fontWeight: '600' },
    roleTextActive: { color: c.onPrimary },
    button: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: '700' },
    switchText: { textAlign: 'center', marginTop: 18, color: c.textMuted },
  });
