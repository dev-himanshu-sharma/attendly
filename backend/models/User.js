import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, 
      "Please enter a valid email address"
    ]
  },
  password: {
    type: String,
    required: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  biometricEnabled: {
    type: Boolean,
    default: false,
  },
  biometricRegistered: {
    type: Boolean,
    default: false,
  },
  biometricApproved: {
    type: Boolean,
    default: false,
  },
  biometricCredentials: [{
    credentialId: String,
    publicKey: Buffer,
    counter: { type: Number, default: 0 },
    transports: [String],
    createdAt: { type: Date, default: Date.now },
  }],
  allowedLocation: {
    lat: Number,
    lng: Number,
    radius: {
      type: Number,
      default: 200,
    },
  },
  lastLoginLocation: {
    lat: Number,
    lng: Number,
    locationName: String,
    updatedAt: Date,
  },
  lastLoginIP: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee"
  }
});

export default mongoose.model("User", userSchema);