export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details = undefined,
    meta = undefined
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.meta = meta;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
