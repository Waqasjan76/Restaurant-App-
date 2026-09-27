import React, { useState } from 'react';
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
import { authenticate, registerUser, users } from '../data/users';
import { validateAuth } from '../utils/validation';
import { showAlert } from '../utils/alert';

const EMPTY_FORM = { fullName: '', email: '', password: '', confirmPassword: '' };

export default function LoginScreen({ navigation }) {
  // UI mode: 'login' or 'signup'
  const [mode, setMode] = useState('login');
  // Controlled inputs
  const [values, setValues] = useState(EMPTY_FORM);
  const [role, setRole] = useState('customer');
  // Separate pieces of UI state
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const handleChange = (field) => (text) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    // Clear the error of this field as soon as the user edits it.
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setErrors({});
    setValues((prev) => ({ ...EMPTY_FORM, email: prev.email }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateAuth(values, mode);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      let user;
      if (isSignup) {
        const created = await registerUser({ ...values, role });
        users.push(created);
        user = created;
      } else {
        user = await authenticate(values.email, values.password);
      }
      const target = user.role === 'manager' ? 'Dashboard' : 'Menu';
      navigation.reset({ index: 0, routes: [{ name: target, params: { user } }] });
    } catch (e) {
      showAlert(isSignup ? 'Signup failed' : 'Login failed', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, label, props = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        value={values[field]}
        onChangeText={handleChange(field)}
        placeholderTextColor="#9a9a9a"
        editable={!isSubmitting}
        {...props}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  return (
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
          secureTextEntry: !showPassword,
          autoCapitalize: 'none',
        })}
        {isSignup &&
          renderField('confirmPassword', 'Confirm password', {
            placeholder: 'Repeat your password',
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
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fffaf5' },
  container: { padding: 24, paddingTop: 48, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 8, color: '#222' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 24, marginTop: 4 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#222',
  },
  inputError: { borderColor: '#d93025' },
  errorText: { color: '#d93025', fontSize: 12, marginTop: 4 },
  toggleRow: { alignSelf: 'flex-end', marginBottom: 12 },
  link: { color: '#e4572e', fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleChipActive: { backgroundColor: '#e4572e', borderColor: '#e4572e' },
  roleText: { color: '#333', fontWeight: '600' },
  roleTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#e4572e',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { textAlign: 'center', marginTop: 18, color: '#555' },
});
