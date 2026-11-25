import mongoose from 'mongoose';

const { Schema } = mongoose;

export const GROUP_TRACK_TYPES = Object.freeze([
  'QURAN_MEMORIZATION',
  'TAJWEED_ONLY',
  'GENERAL_STUDIES',
]);
export const GROUP_STATUSES = Object.freeze(['ACTIVE', 'INACTIVE']);

const scheduleSlotSchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    trackType: {
      type: String,
      enum: GROUP_TRACK_TYPES,
      required: true,
      default: 'QURAN_MEMORIZATION',
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    curriculumDescription: {
      type: String,
      trim: true,
      default: '',
    },
    studentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
      default: [],
    },
    schedule: {
      type: [scheduleSlotSchema],
      default: [],
    },
    level: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: GROUP_STATUSES,
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    collection: 'groups',
  }
);

groupSchema.index({ branchId: 1, trackType: 1 });
groupSchema.index({ teacherId: 1 });
groupSchema.index({ branchId: 1, name: 1 }, { unique: true });

export const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
export default Group;
