import express from "express";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";
import { sendEmail } from "../config/email.js";

const router = express.Router();

// Get all users
router.get("/users", authMiddleware, isAdmin, async (req, res) => {
  const { email } = req.query;
  let query = {};
  
  if (email) {
    query.email = { $regex: email, $options: "i" };
  }
  
  const users = await User.find(query).select("-password");
  res.json(users);
});

router.post("/users/:id/verify-email", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isEmailVerified = true;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Email verified — welcome onboard",
      text: `Hi ${user.name || "User"},\n\nYour account has been approved by the admin and your email is now verified. You can login using your password and later request biometric login for attendance.\n\nBest,\nAttendance App Team`,
      html: `<p>Hi ${user.name || "User"},</p><p>Your account has been approved by the admin and your email is now verified. You can login using your password and later request biometric login for attendance.</p><p>Best,<br/>Attendance App Team</p>`,
    });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Email verification failed", error: err.message });
  }
});

router.post("/users/:id/approve-biometric", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.biometricEnabled) {
      return res.status(400).json({ message: "Biometric login has not been requested" });
    }

    user.biometricApproved = true;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Biometric login approved",
      text: `Hi ${user.name || "User"},\n\nYour biometric login request has been approved by the admin. You can now register your fingerprint and use biometric login. Attendance will be tracked using your biometric check-ins.\n\nBest,\nAttendance App Team`,
      html: `<p>Hi ${user.name || "User"},</p><p>Your biometric login request has been approved by the admin. You can now register your fingerprint and use biometric login. Attendance will be tracked using your biometric check-ins.</p><p>Best,<br/>Attendance App Team</p>`,
    });

    res.json({ message: "Biometric login approved" });
  } catch (err) {
    console.error("Biometric approval error:", err);
    res.status(500).json({ message: "Biometric approval failed", error: err.message });
  }
});

router.post("/users/:id/reject-biometric", authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.biometricEnabled) {
      return res.status(400).json({ message: "No biometric request to reject" });
    }

    user.biometricEnabled = false;
    user.biometricRegistered = false;
    user.biometricApproved = false;
    user.biometricCredentials = [];
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Biometric login request rejected",
      text: `Hi ${user.name || "User"},\n\nYour biometric login request has been rejected by the admin. You can continue to use your email and password for login.\n\nBest,\nAttendance App Team`,
      html: `<p>Hi ${user.name || "User"},</p><p>Your biometric login request has been rejected by the admin. You can continue to use your email and password for login.</p><p>Best,<br/>Attendance App Team</p>`,
    });

    res.json({ message: "Biometric request deleted/rejected" });
  } catch (err) {
    console.error("Biometric rejection error:", err);
    res.status(500).json({ message: "Biometric rejection failed", error: err.message });
  }
});

router.put("/users/:id/location", authMiddleware, isAdmin, async (req, res) => {
  const { lat, lng, radius } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.allowedLocation = {
    lat,
    lng,
    radius: radius || 200,
  };
  await user.save();

  res.json({ message: "User location restriction updated", allowedLocation: user.allowedLocation });
});

// Get all attendance
router.get("/attendance", authMiddleware, isAdmin, async (req, res) => {
  const { startDate, endDate, sortBy } = req.query;
  let query = {};

  // Filter by date range if provided
  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const records = await Attendance.find(query)
    .populate("userId", "name email role")
    .sort(sortBy === "ascending" ? { date: 1 } : { date: -1 });

  res.json(records);
});

// Delete attendance record
router.delete("/attendance/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting record", error: err.message });
  }
});
router.delete("/user/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json("Access denied");
  }

  const userId = req.params.id;

 
  await User.findByIdAndDelete(userId);

  // 🔥 ALSO DELETE ATTENDANCE
  await Attendance.deleteMany({ userId });

  res.json({ message: "User and attendance deleted" });
});

export default router;