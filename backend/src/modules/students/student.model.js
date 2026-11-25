import mongoose from 'mongoose';

const { Schema } = mongoose;

export const STUDENT_STATUSES = Object.freeze(['ACTIVE', 'INACTIVE']);
export const VISUAL_MODES = Object.freeze(['STANDARD', 'HIGH_CONTRAST']);

const guardianContactSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    relation: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const accessibilityPreferencesSchema = new Schema(
  {
    visualMode: {
      type: String,
      enum: VISUAL_MODES,
      default: 'STANDARD',
    },
    fontSizeScale: {
      type: Number,
      default: 1.0,
      min: 1.0,
      max: 2.0,
    },
    audioGuidance: {
      type: Boolean,
      default: false,
    },
    tapToListenEnabled: {
      type: Boolean,
      default: true,
    },
    screenReaderOptimized: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const studentSchema = new Schema(
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    isIndependent: {
      type: Boolean,
      required: true,
      default: false,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    primaryGroupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    secondaryGroupIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
      default: [],
    },
    parentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Parent' }],
      default: [],
    },
    guardianContact: {
      type: guardianContactSchema,
      default: undefined,
    },
    accessibilityPreferences: {
      type: accessibilityPreferencesSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: STUDENT_STATUSES,
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
    collection: 'students',
  }
);

studentSchema.index({ branchId: 1, status: 1 });
studentSchema.index({ primaryGroupId: 1 });
studentSchema.index({ parentIds: 1 });

export const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
