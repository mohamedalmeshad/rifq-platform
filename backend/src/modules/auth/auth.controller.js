import { sendSuccess } from '../../common/utils/response.js';
import { authService } from './auth.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const result = await authService.logout({
      userId: req.user.userId,
      token: req.token,
      tokenPayload: req.tokenPayload,
      fcmToken: req.body?.fcmToken,
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Logged out successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export const registerFcmToken = async (req, res, next) => {
  try {
    const result = await authService.registerFcmToken({
      userId: req.user.userId,
      token: req.body.token,
      platform: req.body.platform,
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'FCM token registered successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Authenticated user retrieved successfully',
      data: { user },
    });
  } catch (err) {
    return next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword({
      userId: req.user.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Password updated successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};
