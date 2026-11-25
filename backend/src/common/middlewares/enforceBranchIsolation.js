import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';

const defaultBranchResolver = (req) =>
  req.params?.branchId || req.body?.branchId || req.query?.branchId || null;

/**
 * Enforces multi-tenant branch isolation for all non-ADMIN roles.
 * ADMIN retains global cross-branch access; all other roles are strictly scoped to JWT branchId.
 */
export const enforceBranchIsolation = (resolveTargetBranchId = defaultBranchResolver) => async (
  req,
  _res,
  next
) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'AUTH_TOKEN_EXPIRED'));
    }

    if (req.user.role === 'ADMIN') {
      req.branchFilter = {};
      return next();
    }

    if (!req.user.branchId) {
      return next(
        new ForbiddenError('User account has no assigned branch scope', 'SCOPE_BRANCH_ISOLATION')
      );
    }

    const targetBranchId = await resolveTargetBranchId(req);

    if (targetBranchId && String(req.user.branchId) !== String(targetBranchId)) {
      return next(
        new ForbiddenError('Cross-branch access is strictly prohibited', 'SCOPE_BRANCH_ISOLATION')
      );
    }

    req.branchFilter = { branchId: req.user.branchId };
    return next();
  } catch (err) {
    return next(err);
  }
};

export default enforceBranchIsolation;
