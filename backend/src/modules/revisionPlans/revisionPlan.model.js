import mongoose from 'mongoose';

const { Schema } = mongoose;

export const REVISION_PLAN_STATUSES = Object.freeze([
  'DRAFT',
  'APPROVED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);

const revisionItemSchema = new Schema(
  {
    surah: {
      type: Number,
      required: true,
      min: 1,
      max: 114,
    },
    startAyah: {
      type: Number,
      required: true,
      min: 1,
    },
    endAyah: {
      type: Number,
      required: true,
      min: 1,
    },
    priorityIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const revisionPlanSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: REVISION_PLAN_STATUSES,
      default: 'DRAFT',
    },
    items: {
      type: [revisionItemSchema],
      default: [],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'revision_plans',
  }
);

revisionPlanSchema.index({ studentId: 1, status: 1, createdAt: -1 });

export const RevisionPlan =
  mongoose.models.RevisionPlan || mongoose.model('RevisionPlan', revisionPlanSchema);
export default RevisionPlan;
