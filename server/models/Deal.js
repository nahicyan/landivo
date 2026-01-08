import mongoose from "mongoose";

const { Schema } = mongoose;

const DealSchema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedById: { type: Schema.Types.ObjectId, ref: "User" },
    modificationHistory: { type: Schema.Types.Mixed },
    purchasePrice: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    downPayment: { type: Number },
    loanAmount: { type: Number },
    interestRate: { type: Number },
    term: { type: Number },
    monthlyPayment: { type: Number },
    closingCosts: { type: Number },
    transferTaxes: { type: Number },
    appraisalValue: { type: Number },
    loanOriginationFee: { type: Number },
    financingType: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "COMPLETED", "DEFAULTED", "CANCELLED"],
      default: "ACTIVE",
    },
    startDate: { type: Date, required: true },
    completionDate: { type: Date },
    paymentsReceived: { type: Number, default: 0 },
    paymentsOnTime: { type: Number, default: 0 },
    paymentsLate: { type: Number, default: 0 },
    totalPaidToDate: { type: Number, default: 0 },
    principalPaid: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    totalExpectedRevenue: { type: Number },
    currentRevenue: { type: Number, default: 0 },
    profitLoss: { type: Number, default: 0 },
    capRate: { type: Number },
    cashOnCashReturn: { type: Number },
    notes: { type: String },
    documents: { type: [String], default: [] },
    payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  },
  { timestamps: true }
);

export const Deal = mongoose.models.Deal || mongoose.model("Deal", DealSchema);
export default Deal;
