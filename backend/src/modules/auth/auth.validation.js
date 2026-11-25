import { z } from 'zod';
import { DEVICE_PLATFORMS } from '../users/user.model.js';

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Valid email address is required').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
    fcmToken: z.string().trim().min(1, 'FCM token cannot be empty').optional(),
    platform: z.enum(DEVICE_PLATFORMS).optional(),
  }),
};

export const logoutSchema = {
  body: z
    .object({
      fcmToken: z.string().trim().min(1, 'FCM token cannot be empty').optional(),
    })
    .optional()
    .default({}),
};

export const fcmTokenSchema = {
  body: z.object({
    token: z.string().trim().min(1, 'Device FCM token is required'),
    platform: z.enum(DEVICE_PLATFORMS).default('WEB'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password must not exceed 128 characters'),
  }),
};
