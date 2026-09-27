export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// At least eight characters and at least one digit.
export const PASSWORD_REGEX = /^(?=.*\d).{8,}$/;
// Pakistani mobile number, e.g. 0300-1234567
export const PK_PHONE_REGEX = /^03\d{2}-\d{7}$/;

export function validateAuth(values, mode) {
  const errors = {};
  if (mode === 'signup' && !values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }
  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!PASSWORD_REGEX.test(values.password)) {
    errors.password = 'Password must be at least 8 characters and contain a digit.';
  }
  if (mode === 'signup' && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}
