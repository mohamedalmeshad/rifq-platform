import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from '../../common/middlewares/authenticateJWT.js';
import { validateRequest } from '../../common/middlewares/validateRequest.js';
import { sendError } from '../../common/utils/response.js';
import {
  loginSchema,
  logoutSchema,
  fcmTokenSchema,
  changePasswordSchema,
} from './auth.validation.js';
import * as authController from './auth.controller.js';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    sendError(res, {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    }),
});

router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/logout', authenticateJWT, validateRequest(logoutSchema), authController.logout);
router.post(
  '/fcm-token',
  authenticateJWT,
  validateRequest(fcmTokenSchema),
  authController.registerFcmToken
);
router.get('/me', authenticateJWT, authController.getMe);
router.patch(
  '/change-password',
  authenticateJWT,
  validateRequest(changePasswordSchema),
  authController.changePassword
);

export default router;
