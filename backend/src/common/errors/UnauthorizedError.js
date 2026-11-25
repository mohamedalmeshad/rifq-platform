import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Authentication required',
    code = 'AUTH_INVALID_CREDENTIALS',
    details = undefined,
    meta = undefined
  ) {
    super(message, 401, code, details, meta);
  }
}

export default UnauthorizedError;
