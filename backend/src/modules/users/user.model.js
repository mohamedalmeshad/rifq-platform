import mongoose from 'mongoose';

const { Schema } = mongoose;

export const USER_ROLES = Object.freeze(['ADMIN', 'MANAGER', 'TEACHER', 'STUDENT', 'PARENT']);
export const USER_STATUSES = Object.freeze(['ACTIVE', 'INACTIVE']);
export const DEVICE_PLATFORMS = Object.freeze(['WEB', 'ANDROID', 'IOS']);

const fcmTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: DEVICE_PLATFORMS,
      default: 'WEB',
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    academyId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: 'ACTIVE',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    fcmTokens: {
      type: [fcmTokenSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ branchId: 1, role: 1 });
userSchema.index({ status: 1 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
