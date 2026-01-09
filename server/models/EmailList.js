import mongoose from "mongoose";

const { Schema } = mongoose;

const EmailListSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    source: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastEmailDate: { type: Date },
    criteria: { type: Schema.Types.Mixed },
    buyerMemberships: [{ type: Schema.Types.ObjectId, ref: "BuyerEmailList" }],
    isDefault: { type: Boolean, default: false },
    color: { type: String },
    modificationHistory: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const EmailList =
  mongoose.models.EmailList || mongoose.model("EmailList", EmailListSchema);
export default EmailList;
