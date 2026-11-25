import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ASSIGNMENT_TYPES = Object.freeze([
  'RECITING',
  'QUIZ',
  'WRITTEN_TASK',
  'READING',
]);

const assignmentSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: '',
    },
    assignmentType: {
      type: String,
      enum: ASSIGNMENT_TYPES,
      required: true,
    },
    targetSurah: {
      type: Number,
      min: 1,
      max: 114,
      default: null,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
      default: 10,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    timeLimitMinutes: {
      type: Number,
      min: 1,
      default: null,
    },
    isLiveRecordingOnly: {
      type: Boolean,
      default: false,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'assignments',
  }
);

assignmentSchema.index({ groupId: 1, dueDate: -1 });
assignmentSchema.index({ studentId: 1, dueDate: -1 });
assignmentSchema.index({ createdBy: 1 });

export const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
export default Assignment;
