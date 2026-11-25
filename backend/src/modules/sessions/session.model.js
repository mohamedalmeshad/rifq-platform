import mongoose from 'mongoose';

const { Schema } = mongoose;

export const SESSION_TYPES = Object.freeze([
  'MEMORIZATION',
  'REVISION',
  'EVALUATION',
  'LESSON',
  'ONLINE',
]);

const sessionSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: SESSION_TYPES,
      required: true,
    },
    onlineClassId: {
      type: Schema.Types.ObjectId,
      ref: 'OnlineClass',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

sessionSchema.index({ groupId: 1, date: -1 });
sessionSchema.index({ teacherId: 1, date: -1 });

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export default Session;
