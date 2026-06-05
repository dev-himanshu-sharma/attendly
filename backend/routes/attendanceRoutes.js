import express from "express";

import Attendance from "../models/Attendance.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Check-in (9 AM to 6 PM only)

router.post("/", authMiddleware, async (req, res) => {
  const now = new Date();

  const currentHour = now.getHours();

  const currentMinute = now.getMinutes();

  const today = now.toISOString().split("T")[0];

  // 1. Block early/late check-ins (before 9am or after 6pm)

  if (currentHour < 9 || currentHour >= 18) {
    return res
      .status(400)
      .json({ message: "Office is closed. Check-in between 9 AM - 6 PM." });
  }

  const existing = await Attendance.findOne({
    userId: req.user.id,
    date: today,
  });

  if (existing)
    return res.status(400).json({ message: "Already checked in today" });

  // 2. Determine Status based on Time

  let finalStatus = "Present";

  if (currentHour === 9 && currentMinute > 15) {
    finalStatus = "Late"; // 9:16 - 9:59
  } else if (currentHour >= 10 && currentHour < 11) {
    // If it's 10:00 - 10:30, it's Late. If after 10:30, it's Half-day.

    finalStatus = currentMinute <= 30 ? "Late" : "Half-day";
  } else if (currentHour >= 11) {
    finalStatus = "Half-day";
  }

  const attendance = await Attendance.create({
    userId: req.user.id,

    date: today,

    checkIn: now,

    status: finalStatus, // Automatically marked!
  });

  res.json(attendance);
});

// Check-in

// Check-out

router.put("/checkout/:id", authMiddleware, async (req, res) => {
  const now = new Date();

  // TEMPORARILY COMMENT THIS OUT TO TEST AT 11:00 PM

  /*

  if (now.getHours() < 18) {

    return res.status(400).json({ message: "Too early to check out." });

  }

  */

  const record = await Attendance.findById(req.params.id);

  const diffInMs = now - new Date(record.checkIn);

  const hoursWorked = (diffInMs / (1000 * 60 * 60)).toFixed(2);

  record.checkOut = now;

  record.workHours = parseFloat(hoursWorked);

  await record.save();

  res.json(record);
});

// Check-out (After 6 PM only)

router.put("/checkout/:id", authMiddleware, async (req, res) => {
  const now = new Date();

  const currentHour = now.getHours();

  // 2. Time Restriction: After 6 PM (18:00)

  if (currentHour < 18) {
    return res.status(400).json({
      message: "You can only check out after 6:00 PM.",
    });
  }

  const record = await Attendance.findById(req.params.id);

  if (!record) return res.status(404).json({ message: "Record not found" });

  if (record.checkOut)
    return res.status(400).json({ message: "Already checked out" });

  // 3. Calculate Hours Worked

  const diffInMs = now - new Date(record.checkIn);

  const hoursWorked = (diffInMs / (1000 * 60 * 60)).toFixed(2); // Convert ms to hours

  record.checkOut = now;

  record.workHours = parseFloat(hoursWorked); // Store hours in DB

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

// Example Admin Route

router.get("/admin/all", async (req, res) => {
  try {
    const attendances = await Attendance.find()

      .populate("userId", "name email role") // <--- Make sure 'role' is included here

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
