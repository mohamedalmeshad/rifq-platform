import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(
    message = 'Requested resource was not found',
    code = 'RESOURCE_NOT_FOUND',
    details = undefined,
    meta = undefined
  ) {
    super(message, 404, code, details, meta);
  }
}

export default NotFoundError;
