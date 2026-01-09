import mongoose from "mongoose";

const { Schema } = mongoose;

const PropertyRowSchema = new Schema(
  {
    name: { type: String },
    rowType: { type: String },
    sort: { type: String },
    displayOrder: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const PropertyRow =
  mongoose.models.PropertyRow || mongoose.model("PropertyRow", PropertyRowSchema);
export default PropertyRow;
