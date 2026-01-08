import mongoose from "mongoose";

const { Schema } = mongoose;

const VisitSchema = new Schema(
  {
    visitorId: { type: String, required: true },
    sessionId: { type: String, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number },
    pagesViewed: { type: Number, default: 1 },
    entryPage: { type: String, required: true },
    exitPage: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    screenSize: { type: String },
  },
  { timestamps: false }
);

VisitSchema.index({ visitorId: 1 });
VisitSchema.index({ startTime: 1 });

export const Visit = mongoose.models.Visit || mongoose.model("Visit", VisitSchema);
export default Visit;
