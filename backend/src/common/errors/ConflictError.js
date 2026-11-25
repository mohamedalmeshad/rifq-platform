import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(
    message = 'Resource conflict detected',
    code = 'DUPLICATE_RESOURCE',
    details = undefined,
    meta = undefined
  ) {
    super(message, 409, code, details, meta);
  }
}

export default ConflictError;
