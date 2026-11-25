import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required', 'AUTH_TOKEN_EXPIRED'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ForbiddenError('Authenticated role lacks permission for this action', 'RBAC_FORBIDDEN')
    );
  }

  return next();
};

export default authorizeRoles;
