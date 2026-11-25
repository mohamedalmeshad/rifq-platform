import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ATTENDANCE_STATUSES = Object.freeze(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);

const attendanceSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'attendance',
  }
);

attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ studentId: 1, createdAt: -1 });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
export default Attendance;
