import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { tokenBlacklistService } from '../../modules/auth/tokenBlacklist.service.js';

export const createAuthenticateJWT = (blacklist = tokenBlacklistService) => async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Bearer authentication token is required', 'AUTH_TOKEN_EXPIRED'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new UnauthorizedError('Authentication token is empty', 'AUTH_TOKEN_EXPIRED'));
    }

    const blacklisted = await blacklist.isBlacklisted(token);
    if (blacklisted) {
      return next(new UnauthorizedError('Authentication token has been revoked', 'AUTH_TOKEN_EXPIRED'));
    }

    const payload = jwt.verify(token, env.JWT_SECRET);

    req.user = {
      userId: payload.sub,
      role: payload.role,
      branchId: payload.branchId ?? null,
      academyId: payload.academyId ?? null,
    };
    req.token = token;
    req.tokenPayload = payload;

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid or expired authentication token', 'AUTH_TOKEN_EXPIRED'));
    }
    return next(err);
  }
};

export const authenticateJWT = createAuthenticateJWT();
export default authenticateJWT;
