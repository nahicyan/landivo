import mongoose from "mongoose";

const { Schema } = mongoose;

const BuyerEmailListSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    emailListId: { type: Schema.Types.ObjectId, ref: "EmailList", required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

BuyerEmailListSchema.index({ buyerId: 1, emailListId: 1 }, { unique: true });
BuyerEmailListSchema.index({ buyerId: 1 });
BuyerEmailListSchema.index({ emailListId: 1 });

export const BuyerEmailList =
  mongoose.models.BuyerEmailList ||
  mongoose.model("BuyerEmailList", BuyerEmailListSchema);
export default BuyerEmailList;
