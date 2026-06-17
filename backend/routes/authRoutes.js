import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import validator from "validator";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { sendEmail } from "../config/email.js";
import { getClientIP, reverseGeocode } from "../utils/geocoding.js";

const commonTlds = new Set([
  "com",
  "net",
  "org",
  "edu",
  "gov",
  "co",
  "in",
  "us",
  "uk",
  "ca",
  "io",
  "app",
  "dev",
  "tech",
  "info",
  "biz",
  "online",
  "store",
  "biz",
  "me",
  "ai",
  "cloud",
  "site",
  "app",
  "work",
  "xyz",
  "agency",
  "company",
  "services",
  "digital",
  "live",
  "shop",
]);

const isValidEmailAddress = (email) => {
  if (!email || !validator.isEmail(email)) return false;
  const domain = email.split("@")[1];
  if (!domain || !domain.includes(".")) return false;
  const tld = domain.split(".").pop().toLowerCase();
  if (!/^[a-z]{2,}$/i.test(tld)) return false;
  return commonTlds.has(tld);
};

const router = express.Router();

const getDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createTokenPayload = (user) => ({
  id: user._id,
  role: user.role,
  name: user.name,
  biometricEnabled: user.biometricEnabled,
  biometricRegistered: user.biometricRegistered,
  biometricApproved: user.biometricApproved,
  isEmailVerified: user.isEmailVerified,
});

const hasVerifiedEmailOrAdmin = (user) => user.role === "admin" || user.isEmailVerified;

const notifyAdmins = async ({ subject, text, html }) => {
  const admins = await User.find({ role: "admin" });
  for (const admin of admins) {
    if (admin.email) {
      await sendEmail({
        to: admin.email,
        subject,
        text,
        html,
      });
    }
  }
};

router.post("/register", async (req, res) => {
  const { name, email, password, allowedLocation } = req.body;

  if (!isValidEmailAddress(email)) {
    return res.status(400).json({ message: "Please enter a valid email address with a real domain." });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    isEmailVerified: false,
    biometricEnabled: false,
    biometricApproved: false,
    allowedLocation: allowedLocation || undefined,
  });

  await sendEmail({
    to: user.email,
    subject: "Registration received — action required",
    text: `Hi ${user.name || "User"},\n\nThank you for registering. Your account has been created and is now waiting for admin verification. You will receive another email once your account is approved.\n\nBest,\nAttendance App Team`,
    html: `<p>Hi ${user.name || "User"},</p><p>Thank you for registering. Your account has been created and is now waiting for admin verification. You will receive another email once your account is approved.</p><p>Best,<br/>Attendance App Team</p>`,
  }).catch((err) => console.warn("Registration email failed:", err.message));

  await notifyAdmins({
    subject: "New user registration pending approval",
    text: `A new user has registered with email ${user.email}. Please verify their account in the admin dashboard.`,
    html: `<p>A new user has registered with email <strong>${user.email}</strong>.</p><p>Please verify their account in the admin dashboard.</p>`,
  }).catch((err) => console.error("Admin notification failed:", err.message));

  res.json({
    message: "Registered successfully. Please wait for admin email verification before signing in.",
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password, location } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (!hasVerifiedEmailOrAdmin(user)) {
    return res.status(403).json({ message: "Email not verified by admin" });
  }

  if (user.allowedLocation?.lat && user.allowedLocation?.lng) {
    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(403).json({ message: "Current location is required for login" });
    }
    const distance = getDistance(
      user.allowedLocation.lat,
      user.allowedLocation.lng,
      location.lat,
      location.lng
    );
    if (distance > user.allowedLocation.radius) {
      return res.status(403).json({ message: "Login not allowed from this location" });
    }
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  if (location && typeof location.lat === "number" && typeof location.lng === "number") {
    const locationName = await reverseGeocode(location.lat, location.lng);
    user.lastLoginLocation = {
      lat: location.lat,
      lng: location.lng,
      locationName: locationName,
      updatedAt: new Date(),
    };
  }

  user.lastLoginIP = getClientIP(req);
  await user.save();

  const token = jwt.sign(
    createTokenPayload(user),
    process.env.JWT_SECRET,
  );

  res.json({ token, user });
});

router.post("/biometric-register", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!hasVerifiedEmailOrAdmin(user)) {
    return res.status(403).json({ message: "Email must be verified before biometric registration." });
  }

  user.biometricRegistered = true;
  user.biometricEnabled = true;
  user.biometricApproved = false;
  await user.save();

  await notifyAdmins({
    subject: "Biometric enrollment requested",
    text: `User ${user.name || user.email} has registered biometric data and is awaiting admin approval.`,
    html: `<p>User <strong>${user.name || user.email}</strong> has registered biometric data and is awaiting admin approval.</p>`,
  }).catch((err) => console.warn("Admin biometric notification failed:", err.message));

  res.json({ message: "Biometric data registered. Waiting for admin approval.", user });
});

router.post("/biometric-request", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (!hasVerifiedEmailOrAdmin(user)) {
    return res.status(403).json({ message: "Email must be verified before biometric registration." });
  }

  user.biometricEnabled = true;
  user.biometricApproved = false;
  await user.save();

  await notifyAdmins({
    subject: "Biometric login access requested",
    text: `User ${user.name || user.email} has requested biometric login access and needs admin approval.`,
    html: `<p>User <strong>${user.name || user.email}</strong> has requested biometric login access and needs admin approval.</p>`,
  }).catch((err) => console.warn("Admin biometric notification failed:", err.message));

  res.json({ message: "Biometric login requested. Waiting for admin approval.", user });
});

router.post("/biometric-login", async (req, res) => {
  const { email, location } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });
  if (!hasVerifiedEmailOrAdmin(user)) {
    return res.status(403).json({ message: "Email not verified by admin" });
  }
  if (!user.biometricEnabled) {
    return res.status(403).json({ message: "Biometric login is not enabled for this account" });
  }
  if (!user.biometricRegistered) {
    return res.status(403).json({ message: "Biometric data has not been registered for this account" });
  }
  if (!user.biometricApproved) {
    return res.status(403).json({ message: "Biometric login is pending admin approval" });
  }
  if (user.allowedLocation?.lat && user.allowedLocation?.lng) {
    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return res.status(403).json({ message: "Current location is required for biometric login" });
    }
    const distance = getDistance(
      user.allowedLocation.lat,
      user.allowedLocation.lng,
      location.lat,
      location.lng
    );
    if (distance > user.allowedLocation.radius) {
      return res.status(403).json({ message: "Login not allowed from this location" });
    }
  }

  const token = jwt.sign(
    createTokenPayload(user),
    process.env.JWT_SECRET,
  );

  if (location && typeof location.lat === "number" && typeof location.lng === "number") {
    const locationName = await reverseGeocode(location.lat, location.lng);
    user.lastLoginLocation = {
      lat: location.lat,
      lng: location.lng,
      locationName: locationName,
      updatedAt: new Date(),
    };
  }

  user.lastLoginIP = getClientIP(req);
  await user.save();

  res.json({ token, user });
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
});

router.post("/password-reset-request", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });
  if (!user.isEmailVerified && user.role !== "admin") {
    return res.status(403).json({ message: "Email must be verified before password reset" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.passwordResetToken = otp;
  user.passwordResetExpires = Date.now() + 3600000;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${otp}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Your password reset OTP",
      text: `Hi ${user.name || "User"},\n\nUse the following OTP to reset your password: ${otp}\n\nOr click this link to open the reset page: ${resetLink}\n\nIt will expire in 60 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest,\nAttendance App Team`,
      html: `<p>Hi ${user.name || "User"},</p><p>Use the following OTP to reset your password:</p><p><strong>${otp}</strong></p><p>You may also click the link below to go directly to the reset page:</p><p><a href="${resetLink}">${resetLink}</a></p><p>It will expire in 60 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Best,<br/>Attendance App Team</p>`,
    });
  } catch (err) {
    console.error("Password reset email failed:", err);
    return res.status(500).json({ message: "Unable to send password reset email. Please try again later." });
  }

  res.json({
    message: "OTP sent to your email. Use it to reset your password.",
  });
});

router.post("/password-reset", async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset successfully" });
});

export default router;
