import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/index.js';
import { User } from '../users/user.model.js';
import { Student } from '../students/student.model.js';
import { Teacher } from '../teachers/teacher.model.js';
import { Parent } from '../parents/parent.model.js';
import { tokenBlacklistService } from './tokenBlacklist.service.js';

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const upsertFcmTokenEntry = (fcmTokens = [], token, platform = 'WEB') => {
  const filtered = fcmTokens.filter((entry) => entry.token !== token);
  filtered.push({
    token,
    platform,
    updatedAt: new Date(),
  });
  return filtered;
};

const formatSafeUser = (userDoc, profile = null) => ({
  _id: userDoc._id,
  email: userDoc.email,
  role: userDoc.role,
  branchId: userDoc.branchId ?? null,
  academyId: userDoc.academyId ?? null,
  status: userDoc.status,
  profileId: profile?._id ?? null,
  fullName: profile?.fullName ?? null,
});

export const createAuthService = ({
  UserModel = User,
  StudentModel = Student,
  TeacherModel = Teacher,
  ParentModel = Parent,
  tokenBlacklist = tokenBlacklistService,
} = {}) => {
  const resolveRoleProfile = async (user) => {
    const query = { userId: user._id };
    const projection = '_id fullName';

    if (user.role === 'STUDENT' && StudentModel?.findOne) {
      return StudentModel.findOne(query).select(projection).lean();
    }
    if (user.role === 'TEACHER' && TeacherModel?.findOne) {
      return TeacherModel.findOne(query).select(projection).lean();
    }
    if (user.role === 'PARENT' && ParentModel?.findOne) {
      return ParentModel.findOne(query).select(projection).lean();
    }
    return null;
  };

  const login = async ({ email, password, fcmToken, platform = 'WEB' }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is deactivated', 'AUTH_ACCOUNT_INACTIVE');
    }

    const now = Date.now();
    if (user.lockUntil && new Date(user.lockUntil).getTime() > now) {
      throw new ForbiddenError(
        'Account is temporarily locked due to multiple failed login attempts',
        'AUTH_ACCOUNT_LOCKED',
        undefined,
        { lockUntil: new Date(user.lockUntil).toISOString() }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(now + LOCKOUT_DURATION_MS);
        await user.save();
        throw new ForbiddenError(
          'Account locked for 15 minutes after 5 consecutive failed login attempts',
          'AUTH_ACCOUNT_LOCKED',
          undefined,
          { lockUntil: user.lockUntil.toISOString() }
        );
      }

      await user.save();
      throw new UnauthorizedError('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    if (fcmToken) {
      user.fcmTokens = upsertFcmTokenEntry(user.fcmTokens, fcmToken, platform);
    }

    await user.save();

    const jwtPayload = {
      sub: String(user._id),
      role: user.role,
      branchId: user.branchId ? String(user.branchId) : null,
      academyId: user.academyId ? String(user.academyId) : null,
    };

    const accessToken = jwt.sign(jwtPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const profile = await resolveRoleProfile(user);

    return {
      accessToken,
      expiresIn: env.JWT_EXPIRES_IN,
      user: formatSafeUser(user, profile),
    };
  };

  const logout = async ({ userId, token, tokenPayload, fcmToken }) => {
    const expiresAtMs = tokenPayload?.exp
      ? tokenPayload.exp * 1000
      : Date.now() + 8 * 60 * 60 * 1000;

    await tokenBlacklist.add(token, expiresAtMs);

    if (fcmToken) {
      await UserModel.updateOne(
        { _id: userId },
        { $pull: { fcmTokens: { token: fcmToken } } }
      );
    }

    return { loggedOut: true };
  };

  const registerFcmToken = async ({ userId, token, platform = 'WEB' }) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'RESOURCE_NOT_FOUND');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is deactivated', 'AUTH_ACCOUNT_INACTIVE');
    }

    user.fcmTokens = upsertFcmTokenEntry(user.fcmTokens, token, platform);
    await user.save();

    return {
      fcmTokensCount: user.fcmTokens.length,
      registeredToken: {
        token,
        platform,
      },
    };
  };

  const getCurrentUser = async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found', 'RESOURCE_NOT_FOUND');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is deactivated', 'AUTH_ACCOUNT_INACTIVE');
    }

    const profile = await resolveRoleProfile(user);
    return formatSafeUser(user, profile);
  };

  const changePassword = async ({ userId, currentPassword, newPassword }) => {
    const user = await UserModel.findById(userId).select('+passwordHash');
    if (!user) {
      throw new NotFoundError('User account not found', 'RESOURCE_NOT_FOUND');
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('User account is deactivated', 'AUTH_ACCOUNT_INACTIVE');
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError('Current password is incorrect', 'AUTH_INVALID_CREDENTIALS');
    }

    user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await user.save();

    return { passwordUpdated: true };
  };

  return {
    login,
    logout,
    registerFcmToken,
    getCurrentUser,
    changePassword,
  };
};

export const authService = createAuthService();
export default authService;
