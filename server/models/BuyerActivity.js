import mongoose from "mongoose";

const { Schema } = mongoose;

const BuyerActivitySchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    eventType: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    eventData: { type: Schema.Types.Mixed },
    sessionId: { type: String },
    page: { type: String },
    propertyId: { type: String },
    interactionType: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: false }
);

BuyerActivitySchema.index({ buyerId: 1 });
BuyerActivitySchema.index({ eventType: 1 });
BuyerActivitySchema.index({ timestamp: 1 });
BuyerActivitySchema.index({ propertyId: 1 });
BuyerActivitySchema.index({ sessionId: 1 });

export const BuyerActivity =
  mongoose.models.BuyerActivity ||
  mongoose.model("BuyerActivity", BuyerActivitySchema);
export default BuyerActivity;
