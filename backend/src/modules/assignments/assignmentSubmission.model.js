import mongoose from 'mongoose';

const { Schema } = mongoose;

export const INTEGRITY_FLAGS = Object.freeze(['NONE', 'REVIEW_REQUIRED']);

const assignmentSubmissionSchema = new Schema(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    submissionContent: {
      type: String,
      required: true,
      trim: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      default: null,
    },
    submissionDurationSeconds: {
      type: Number,
      min: 0,
      default: null,
    },
    tabSwitchesCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    pasteEventCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isLiveAudioVerified: {
      type: Boolean,
      default: false,
    },
    integrityFlag: {
      type: String,
      enum: INTEGRITY_FLAGS,
      default: 'NONE',
    },
  },
  {
    timestamps: true,
    collection: 'assignment_submissions',
  }
);

assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ integrityFlag: 1, createdAt: -1 });
assignmentSubmissionSchema.index({ studentId: 1, submissionDate: -1 });

export const AssignmentSubmission =
  mongoose.models.AssignmentSubmission ||
  mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
