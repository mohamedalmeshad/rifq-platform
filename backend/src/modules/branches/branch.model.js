import mongoose from 'mongoose';

const { Schema } = mongoose;

export const BRANCH_STATUSES = Object.freeze(['ACTIVE', 'INACTIVE']);

const branchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    managerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: BRANCH_STATUSES,
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    collection: 'branches',
  }
);

branchSchema.index({ status: 1 });
branchSchema.index({ managerUserId: 1 });

export const Branch = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
export default Branch;
