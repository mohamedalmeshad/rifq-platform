import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action',
    code = 'RBAC_FORBIDDEN',
    details = undefined,
    meta = undefined
  ) {
    super(message, 403, code, details, meta);
  }
}

export default ForbiddenError;
