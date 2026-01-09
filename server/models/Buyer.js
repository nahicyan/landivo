import mongoose from "mongoose";

const { Schema } = mongoose;

const BuyerSchema = new Schema(
  {
    email: { type: String, required: true },
    phone: { type: String },
    buyerType: {
      type: String,
      enum: ["CashBuyer", "Builder", "Developer", "Realtor", "Investor", "Wholesaler"],
    },
    firstName: { type: String },
    lastName: { type: String },
    source: { type: String },
    preferredAreas: { type: [String], default: [] },
    preferredCity: { type: [String], default: [] },
    preferredCounty: { type: [String], default: [] },
    offers: [{ type: Schema.Types.ObjectId, ref: "Offer" }],
    auth0Id: { type: String },
    emailStatus: { type: String },
    emailPermissionStatus: { type: String },
    weeklyUpdates: { type: String },
    holidayDeals: { type: String },
    specialDiscounts: { type: String },
    emailListMemberships: [{ type: Schema.Types.ObjectId, ref: "BuyerEmailList" }],
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    updatedById: { type: Schema.Types.ObjectId, ref: "User" },
    modificationHistory: { type: Schema.Types.Mixed },
    deals: [{ type: Schema.Types.ObjectId, ref: "Deal" }],
    activities: [{ type: Schema.Types.ObjectId, ref: "BuyerActivity" }],
  },
  { timestamps: true }
);

BuyerSchema.index({ email: 1 });

export const Buyer =
  mongoose.models.Buyer || mongoose.model("Buyer", BuyerSchema);
export default Buyer;
