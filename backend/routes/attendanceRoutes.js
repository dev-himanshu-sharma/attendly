import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Check-in (9 AM to 6 PM only) - REQUIRES BIOMETRIC VERIFICATION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toISOString().split("T")[0];

    // Check office hours
    if (currentHour < 9 || currentHour >= 18) {
      return res
        .status(400)
        .json({ message: "Office is closed. Check-in between 9 AM - 6 PM." });
    }

    // Get user to check biometric status
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user has biometric approved
    if (user.biometricApproved && !user.biometricRegistered) {
      return res.status(403).json({ message: "Please register your fingerprint first" });
    }

    if (user.biometricApproved && !req.body.biometricVerified) {
      return res.status(403).json({ 
        message: "Biometric verification required - please verify your fingerprint" 
      });
    }

    // For users with biometric approval, verify the biometric token
    if (user.biometricApproved && req.body.biometricVerified) {
      if (req.body.credentialId && !user.biometricCredentials.some(c => c.credentialId === req.body.credentialId)) {
        return res.status(403).json({ message: "Invalid biometric credential" });
      }
    }

    // Check if already checked in today
    const existing = await Attendance.findOne({
      userId: req.user.id,
      date: today,
    });

    if (existing) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Determine attendance status based on time
    let finalStatus = "Present";
    if (currentHour === 9 && currentMinute > 15) {
      finalStatus = "Late";
    } else if (currentHour >= 10 && currentHour < 11) {
      finalStatus = currentMinute <= 30 ? "Late" : "Half-day";
    } else if (currentHour >= 11) {
      finalStatus = "Half-day";
    }

    // Create attendance record
    const attendance = await Attendance.create({
      userId: req.user.id,
      date: today,
      checkIn: now,
      biometricCheckIn: user.biometricApproved && req.body.biometricVerified,
      status: finalStatus,
    });

    res.json({
      message: "Check-in successful",
      attendance,
    });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ message: "Check-in failed", error: err.message });
  }
});

router.put("/checkout/:id", authMiddleware, async (req, res) => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour < 18) {
    return res.status(400).json({
      message: "You can only check out after 6:00 PM.",
    });
  }

  const record = await Attendance.findById(req.params.id);

  if (!record) return res.status(404).json({ message: "Record not found" });

  if (record.checkOut)
    return res.status(400).json({ message: "Already checked out" });

  const diffInMs = now - new Date(record.checkIn);
  const hoursWorked = (diffInMs / (1000 * 60 * 60)).toFixed(2);

  record.checkOut = now;
  record.workHours = parseFloat(hoursWorked);

  await record.save();

  res.json(record);
});

// Get user records

router.get("/me", authMiddleware, async (req, res) => {
  const records = await Attendance.find({
    userId: req.user.id,
  }).sort({ date: -1 });

  res.json(records);
});



router.get("/admin/all", async (req, res) => {
  try {
    const attendances = await Attendance.find()

      .populate("userId", "name email role") 

      .sort({ date: -1 });

    res.json(attendances);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/shortage", authMiddleware, async (req, res) => {
  const records = await Attendance.find({
    userId: req.user.id
  });

  const totalDays = records.length;

  const presentDays = records.filter(
    (r) => r.status !== "Leave"
  ).length;

  const percentage =
    totalDays === 0
      ? 0
      : ((presentDays / totalDays) * 100).toFixed(2);

  res.json({
    totalDays,
    presentDays,
    percentage,
    shortage: percentage < 75
  });
});

export default router;
