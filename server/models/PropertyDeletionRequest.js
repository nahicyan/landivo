import mongoose from "mongoose";

const { Schema } = mongoose;

const PropertyDeletionRequestSchema = new Schema(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    reason: { type: String },
    token: { type: String, required: true, unique: true },
    requestedBy: { type: String },
    requestedByAuth0Id: { type: String },
    requestedByName: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "EXPIRED", "REJECTED"],
      default: "PENDING",
    },
    expiresAt: { type: Date, required: true },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export const PropertyDeletionRequest =
  mongoose.models.PropertyDeletionRequest ||
  mongoose.model("PropertyDeletionRequest", PropertyDeletionRequestSchema);
export default PropertyDeletionRequest;
