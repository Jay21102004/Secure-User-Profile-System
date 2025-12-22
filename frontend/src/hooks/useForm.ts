import { useState } from 'react';
import { FormErrors, parseApiErrors } from '../utils/helpers';

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => FormErrors;
  onSubmit: (values: T) => Promise<void>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[name as string]) {
      setErrors((prev: FormErrors) => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors((prev: FormErrors) => ({
      ...prev,
      [name as string]: [error]
    }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
    setIsDirty(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Run client-side validation if provided
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      await onSubmit(values);
      setIsDirty(false);
    } catch (error: any) {
      const apiErrors = parseApiErrors(error);
      setErrors(apiErrors);
      throw error; // Re-throw so calling component can handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldProps = (name: keyof T) => ({
    name: name as string,
    value: values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValue(name, e.target.value);
    },
    error: errors[name as string]?.[0]
  });

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    setValue,
    setFieldError,
    clearErrors,
    reset,
    handleSubmit,
    getFieldProps
  };
}