import { useState, useCallback } from "react";
import {
  validateField,
  confirmPasswordValidate,
} from "../validations/auth.validate";

/**
 * Hook dùng chung quản lý state & validate real-time cho form Auth
 */
export function useAuthForm<T extends Record<string, unknown>>(
  initialValues: T,
  validateFormFn: (values: T) => Record<string, string>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((field: keyof T, value: T[keyof T]) => {
    const fieldStr = String(field);
    setValues((prev) => {
      const newValues = { ...prev, [field]: value };
      return newValues;
    });

    setTouched((prevTouched) => {
      const isTouched = prevTouched[fieldStr] || (typeof value === "string" && value.length > 0);
      return isTouched ? { ...prevTouched, [fieldStr]: true } : prevTouched;
    });

    setValues((latestValues) => {
      const err = validateField(fieldStr, value, latestValues);
      setErrors((prevErr) => {
        const nextErr = { ...prevErr, [fieldStr]: err || undefined };
        // Special check for password changes affecting confirmPassword
        const confirmPassword = (latestValues as Record<string, unknown>).confirmPassword;
        if (fieldStr === "password" && typeof confirmPassword === "string" && confirmPassword) {
          const confirmErr = confirmPasswordValidate(
            confirmPassword,
            String(value),
          );
          nextErr.confirmPassword = confirmErr || undefined;
        }
        return nextErr;
      });
      return latestValues;
    });
  }, []);

  const setFields = useCallback((partial: Partial<T>) => {
    setValues((prev) => {
      const newValues = { ...prev, ...partial };
      Object.keys(partial).forEach((key) => {
        const fieldStr = String(key);
        const val = partial[key as keyof T];
        const err = validateField(fieldStr, val, newValues);
        setErrors((prevErr) => ({ ...prevErr, [fieldStr]: err || undefined }));
      });
      return newValues;
    });
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    const fieldStr = String(field);
    setTouched((prev) => ({ ...prev, [fieldStr]: true }));
    setValues((currentValues) => {
      const err = validateField(fieldStr, currentValues[field], currentValues);
      setErrors((prev) => ({ ...prev, [fieldStr]: err || undefined }));
      return currentValues;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const allTouched: Record<string, boolean> = {};
    Object.keys(values).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    const validationErrors = validateFormFn(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [validateFormFn, values]);

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    setFields,
    handleBlur,
    validate,
  };
}

