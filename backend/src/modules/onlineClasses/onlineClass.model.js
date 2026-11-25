import mongoose from 'mongoose';

const { Schema } = mongoose;

const onlineClassSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    meetingUrl: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'online_classes',
  }
);

onlineClassSchema.index({ groupId: 1, scheduledAt: -1 });

export const OnlineClass =
  mongoose.models.OnlineClass || mongoose.model('OnlineClass', onlineClassSchema);
export default OnlineClass;
