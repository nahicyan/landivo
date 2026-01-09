import mongoose from "mongoose";

const { Schema } = mongoose;

const PdfTemplateSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const PdfTemplate =
  mongoose.models.PdfTemplate || mongoose.model("PdfTemplate", PdfTemplateSchema);
export default PdfTemplate;
