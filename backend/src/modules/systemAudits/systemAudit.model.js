import mongoose from 'mongoose';

const { Schema } = mongoose;

const systemAuditSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'system_audits',
  }
);

systemAuditSchema.index({ performedBy: 1, timestamp: -1 });
systemAuditSchema.index({ action: 1, timestamp: -1 });

export const SystemAudit =
  mongoose.models.SystemAudit || mongoose.model('SystemAudit', systemAuditSchema);
export default SystemAudit;
