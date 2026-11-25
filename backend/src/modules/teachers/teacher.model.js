import mongoose from 'mongoose';

const { Schema } = mongoose;

const teacherSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    assignedGroupIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'teachers',
  }
);

teacherSchema.index({ branchId: 1 });
teacherSchema.index({ assignedGroupIds: 1 });

export const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);
export default Teacher;
