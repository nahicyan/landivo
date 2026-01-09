import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    auth0Id: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    profileRole: { type: String },
    avatarUrl: { type: String },
    allowedProfiles: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
