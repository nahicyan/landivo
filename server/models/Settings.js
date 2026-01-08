import mongoose from "mongoose";

const { Schema } = mongoose;

const SettingsSchema = new Schema(
  {
    systemContactPhone: { type: String },
    overrideContactPhone: { type: String },
    smtpServer: { type: String },
    smtpPort: { type: String },
    smtpUser: { type: String },
    smtpPassword: { type: String },
    displayIncomplete: { type: Boolean, default: false },
    displaySold: { type: Boolean, default: false },
    displayNotAvailable: { type: Boolean, default: false },
    displayNotTesting: { type: Boolean, default: false },
    enableOfferEmails: { type: Boolean, default: false },
    offerEmailRecipients: { type: [String], default: [] },
    enableFinancingEmails: { type: Boolean, default: false },
    financingEmailRecipients: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
export default Settings;
