import mongoose from "mongoose";

const { Schema } = mongoose;

const VisitorSchema = new Schema(
  {
    visitorId: { type: String, required: true, unique: true },
    firstVisit: { type: Date, default: Date.now },
    lastVisit: { type: Date, default: Date.now },
    totalVisits: { type: Number, default: 1 },
    country: { type: String },
    region: { type: String },
    deviceType: { type: String },
    browser: { type: String },
    os: { type: String },
    visits: [{ type: Schema.Types.ObjectId, ref: "Visit" }],
  },
  { timestamps: true }
);

export const Visitor =
  mongoose.models.Visitor || mongoose.model("Visitor", VisitorSchema);
export default Visitor;
