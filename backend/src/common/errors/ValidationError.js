import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(
    message = 'Request validation failed',
    code = 'VALIDATION_ERROR',
    details = undefined,
    meta = undefined
  ) {
    super(message, 400, code, details, meta);
  }
}

export default ValidationError;
