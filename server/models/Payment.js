import mongoose from "mongoose";

const { Schema } = mongoose;

const PaymentSchema = new Schema(
  {
    dealId: { type: Schema.Types.ObjectId, ref: "Deal", required: true },
    paymentNumber: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "LATE", "MISSED"],
      default: "PENDING",
    },
    principal: { type: Number, required: true },
    interest: { type: Number, required: true },
    lateFee: { type: Number },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    updatedById: { type: Schema.Types.ObjectId, ref: "User" },
    modificationHistory: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
export default Payment;
