import { useCallback, useMemo, useState } from 'react';

/**
 * Generic form state.
 * @param {object} initialValues  e.g. { email: '', password: '' }
 * @param {(values) => object} validate  returns { field: 'message' } for invalid fields
 */
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Curried so it plugs straight into onChangeText: handleChange('email')
  const handleChange = useCallback(
    (field) => (value) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // A field's error disappears as soon as the user edits it.
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  // handleSubmit(onValid) returns the press handler. onValid may be async.
  const handleSubmit = useCallback(
    (onValid) => async () => {
      const validationErrors = validate(values);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;
      setIsSubmitting(true);
      try {
        await onValid(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values]
  );

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
    },
    [initialValues]
  );

  const isValid = useMemo(() => Object.keys(validate(values)).length === 0, [validate, values]);

  return { values, errors, handleChange, handleSubmit, reset, isValid, isSubmitting, setValues };
}
