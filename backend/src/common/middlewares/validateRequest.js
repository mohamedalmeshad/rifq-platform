import { ZodError } from 'zod';
import { ValidationError } from '../errors/ValidationError.js';

const formatZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.') || 'request',
    issue: issue.message,
  }));

/**
 * Validates req.body, req.query, and/or req.params against Zod schemas.
 * Accepts either `{ body?, query?, params? }` or a single Zod schema for `req.body`.
 */
export const validateRequest = (schemaConfig) => (req, _res, next) => {
  try {
    if (schemaConfig && typeof schemaConfig.parse === 'function') {
      req.body = schemaConfig.parse(req.body);
      return next();
    }

    if (schemaConfig?.params) {
      req.params = schemaConfig.params.parse(req.params);
    }
    if (schemaConfig?.query) {
      req.query = schemaConfig.query.parse(req.query);
    }
    if (schemaConfig?.body) {
      req.body = schemaConfig.body.parse(req.body);
    }

    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(
        new ValidationError('Request validation failed', 'VALIDATION_ERROR', formatZodIssues(err.issues))
      );
    }
    return next(err);
  }
};

export default validateRequest;
