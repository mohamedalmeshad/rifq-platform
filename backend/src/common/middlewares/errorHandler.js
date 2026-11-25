import { ZodError } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';
import { sendError } from '../utils/response.js';

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
      meta: err.meta,
    });
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'request',
      issue: issue.message,
    }));
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details,
    });
  }

  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((fieldErr) => ({
      field: fieldErr.path,
      issue: fieldErr.message,
    }));
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Database schema validation failed',
      details,
    });
  }

  if (err.name === 'CastError') {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: `Invalid identifier format for field "${err.path}"`,
      details: [{ field: err.path, issue: 'Malformed ObjectId or type value' }],
    });
  }

  if (err.code === 11000) {
    const duplicateFields = Object.keys(err.keyPattern || err.keyValue || {});
    const details = duplicateFields.map((field) => ({
      field,
      issue: `${field} already exists`,
    }));
    return sendError(res, {
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE',
      message: 'A resource with the supplied unique identifier already exists',
      details,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, {
      statusCode: 401,
      code: 'AUTH_TOKEN_EXPIRED',
      message: 'Invalid or expired authentication token',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Malformed JSON request payload',
    });
  }

  if (env.NODE_ENV !== 'test') {
    console.error('[UnhandledError]', err);
  }

  return sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message,
  });
};

export default errorHandler;
