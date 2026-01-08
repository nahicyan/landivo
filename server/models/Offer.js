import mongoose from "mongoose";

const { Schema } = mongoose;

const OfferSchema = new Schema(
  {
    propertyId: { type: String, required: true },
    offeredPrice: { type: Number, required: true },
    counteredPrice: { type: Number },
    timestamp: { type: Date, default: Date.now },
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    offerStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED"],
      default: "PENDING",
    },
    buyerMessage: { type: String },
    sysMessage: { type: String },
    offerHistory: { type: [Schema.Types.Mixed], default: [] },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    updatedById: { type: Schema.Types.ObjectId, ref: "User" },
    modificationHistory: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Offer =
  mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
export default Offer;
