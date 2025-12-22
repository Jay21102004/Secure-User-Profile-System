import { FormErrors } from '../types';

/**
 * Utility functions for form validation and data handling
 */

// Export the FormErrors type for use in other modules
export type { FormErrors };

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    '12345678', 'password1', 'welcome', 'letmein', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAadhaar = (aadhaar: string): { isValid: boolean; error?: string } => {
  if (!aadhaar) {
    return { isValid: false, error: 'Aadhaar number is required' };
  }

  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(aadhaar)) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }

  return { isValid: true };
};

export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }

  return { isValid: true };
};

export const formatAadhaar = (aadhaar: string): string => {
  // Format: XXXX XXXX XXXX
  const cleaned = aadhaar.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return cleaned;
};

export const maskAadhaar = (aadhaar: string): string => {
  // Format: XXXX XXXX 1234 (show only last 4 digits)
  if (aadhaar && aadhaar.length >= 4) {
    const lastFour = aadhaar.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  }
  return 'XXXX XXXX XXXX';
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if it's the same day
    const isSameDay = date.toDateString() === now.toDateString();
    
    if (isSameDay) {
      // Same day: show only time
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } else {
      // Different day: show time + date
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    return 'Unknown';
  }
};

export const parseApiErrors = (error: any): FormErrors => {
  const errors: FormErrors = {};

  if (error?.response?.data?.errors) {
    // Handle validation errors from express-validator
    error.response.data.errors.forEach((err: any) => {
      if (!errors[err.field]) {
        errors[err.field] = [];
      }
      errors[err.field].push(err.message);
    });
  } else if (error?.response?.data?.error?.details) {
    // Handle mongoose validation errors
    error.response.data.error.details.forEach((detail: any) => {
      if (!errors[detail.field]) {
        errors[detail.field] = [];
      }
      errors[detail.field].push(detail.message);
    });
  } else if (error?.response?.data?.message) {
    // Handle general error messages
    errors.general = [error.response.data.message];
  } else if (error?.message) {
    // Handle network or other errors
    errors.general = [error.message];
  } else {
    // Fallback error
    errors.general = ['An unexpected error occurred. Please try again.'];
  }

  return errors;
};

export const getErrorMessage = (errors: FormErrors, field?: string): string => {
  if (field && errors[field]) {
    return errors[field][0];
  }
  
  if (errors.general) {
    return errors.general[0];
  }

  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    return errors[firstErrorField][0];
  }

  return 'An error occurred';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  }) as T;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};