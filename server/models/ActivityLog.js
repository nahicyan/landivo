import mongoose from "mongoose";

const { Schema } = mongoose;

const ActivityLogSchema = new Schema(
  {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    actionType: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    previousData: { type: Schema.Types.Mixed },
    newData: { type: Schema.Types.Mixed },
    details: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ActivityLogSchema.index({ entityType: 1, entityId: 1 });
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ actionType: 1 });
ActivityLogSchema.index({ createdAt: 1 });

export const ActivityLog =
  mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
export default ActivityLog;
