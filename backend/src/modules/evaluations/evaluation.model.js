import mongoose from 'mongoose';

const { Schema } = mongoose;

export const EVALUATION_TYPES = Object.freeze(['REGULAR', 'FINAL']);

const evaluationSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    type: {
      type: String,
      enum: EVALUATION_TYPES,
      required: true,
    },
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'evaluations',
  }
);

evaluationSchema.index({ studentId: 1, createdAt: -1 });
evaluationSchema.index({ groupId: 1, type: 1 });

export const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
