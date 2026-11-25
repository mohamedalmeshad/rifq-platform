import mongoose from 'mongoose';

const { Schema } = mongoose;

const parentSchema = new Schema(
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
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    studentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'parents',
  }
);

parentSchema.index({ studentIds: 1 });

export const Parent = mongoose.models.Parent || mongoose.model('Parent', parentSchema);
export default Parent;
