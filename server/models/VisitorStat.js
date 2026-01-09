import mongoose from "mongoose";

const { Schema } = mongoose;

const VisitorStatSchema = new Schema(
  {
    date: { type: Date, required: true, unique: true },
    uniqueVisitors: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    newVisitors: { type: Number, default: 0 },
    returningVisitors: { type: Number, default: 0 },
    topPages: { type: Schema.Types.Mixed },
    deviceBreakdown: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const VisitorStat =
  mongoose.models.VisitorStat || mongoose.model("VisitorStat", VisitorStatSchema);
export default VisitorStat;
