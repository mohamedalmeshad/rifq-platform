import mongoose from 'mongoose';

const { Schema } = mongoose;

export const DELIVERY_CHANNELS = Object.freeze(['IN_APP', 'PUSH']);

const notificationSchema = new Schema(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryChannels: {
      type: [
        {
          type: String,
          enum: DELIVERY_CHANNELS,
        },
      ],
      default: ['IN_APP'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ branchId: 1 });

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
