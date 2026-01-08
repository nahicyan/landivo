import mongoose from "mongoose";

const { Schema } = mongoose;

const QualificationSchema = new Schema(
  {
    propertyId: { type: String },
    propertyPrice: { type: Number, required: true },
    ownerId: { type: Number },
    loanAmount: { type: Number },
    interestRate: { type: Number },
    monthlyPayment: { type: Number },
    downPayment: { type: Number },
    term: { type: Number },
    updatedById: { type: Schema.Types.ObjectId, ref: "User" },
    modificationHistory: { type: Schema.Types.Mixed },
    language: { type: String },
    homeUsage: { type: String },
    realEstateAgent: { type: String },
    homePurchaseTiming: { type: String },
    currentHomeOwnership: { type: String },
    currentOnAllPayments: { type: String },
    employmentStatus: { type: String },
    verifyIncome: { type: String },
    incomeHistory: { type: String },
    openCreditLines: { type: String },
    totalMonthlyPayments: { type: Number },
    grossAnnualIncome: { type: String },
    foreclosureForbearance: { type: String },
    declaredBankruptcy: { type: String },
    currentCreditScore: { type: String },
    liensOrJudgments: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    qualified: { type: Boolean, default: false },
    disqualificationReason: { type: String },
    propertyAddress: { type: String },
    propertyCity: { type: String },
    propertyState: { type: String },
    propertyZip: { type: String },
  },
  { timestamps: true }
);

export const Qualification =
  mongoose.models.Qualification || mongoose.model("Qualification", QualificationSchema);
export default Qualification;
