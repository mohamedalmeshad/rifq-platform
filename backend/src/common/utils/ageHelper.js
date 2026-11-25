import { env } from '../../config/env.js';
import { ValidationError } from '../errors/ValidationError.js';

export const calculateAge = (dateOfBirth, referenceDate = new Date()) => {
  const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    throw new ValidationError('Invalid dateOfBirth provided', 'VALIDATION_ERROR', [
      { field: 'dateOfBirth', issue: 'Must be a valid date' },
    ]);
  }

  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  if (dob > ref) {
    throw new ValidationError('dateOfBirth cannot be in the future', 'VALIDATION_ERROR', [
      { field: 'dateOfBirth', issue: 'Date cannot be in the future' },
    ]);
  }

  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = ref.getUTCMonth() - dob.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && ref.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }

  return age;
};

export const isAdultStudent = (
  dateOfBirth,
  threshold = env.ADULT_AGE_THRESHOLD,
  referenceDate = new Date()
) => calculateAge(dateOfBirth, referenceDate) >= threshold;

export const evaluateStudentIndependence = (
  dateOfBirth,
  threshold = env.ADULT_AGE_THRESHOLD,
  referenceDate = new Date()
) => {
  const age = calculateAge(dateOfBirth, referenceDate);
  const isIndependent = age >= threshold;

  return {
    age,
    threshold,
    isIndependent,
    guardianRequired: !isIndependent,
  };
};
