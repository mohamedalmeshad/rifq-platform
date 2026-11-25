import mongoose from 'mongoose';
import { validateAyahRange } from '../../common/utils/quranMetadata.js';

const { Schema } = mongoose;

export const QURAN_PROGRESS_TYPES = Object.freeze(['NEW_MEMORIZATION', 'REVISION']);
export const QURAN_PROGRESS_SOURCES = Object.freeze(['TEACHER', 'AI_ASSISTED']);
export const VERIFICATION_STATUSES = Object.freeze(['PENDING_MONITOR', 'VERIFIED']);

const quranProgressSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
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
    type: {
      type: String,
      enum: QURAN_PROGRESS_TYPES,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    tajweedScore: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },
    mistakeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: QURAN_PROGRESS_SOURCES,
      default: 'TEACHER',
    },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: 'VERIFIED',
    },
    monitoredBy: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'quran_progress',
  }
);

quranProgressSchema.pre('validate', function enforceQuranBounds() {
  if (this.surah != null && this.startAyah != null && this.endAyah != null) {
    validateAyahRange(this.surah, this.startAyah, this.endAyah);
  }
});

quranProgressSchema.index({ studentId: 1, surah: 1, createdAt: -1 });
quranProgressSchema.index({ verificationStatus: 1, source: 1, createdAt: -1 });
quranProgressSchema.index({ sessionId: 1 });

export const QuranProgress =
  mongoose.models.QuranProgress || mongoose.model('QuranProgress', quranProgressSchema);
export default QuranProgress;
