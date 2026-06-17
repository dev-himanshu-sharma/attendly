import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply for leave
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, reason, type } = req.body;
    
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: "Start date, end date, and reason are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    // Create leave records for each day
    const leaveRecords = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = currentDate.toISOString().split("T")[0];
        
        // Check if attendance record already exists
        const existing = await Attendance.findOne({
          userId: req.user.id,
          date: dateStr,
        });

        if (!existing) {
          const record = await Attendance.create({
            userId: req.user.id,
            date: dateStr,
            status: "Leave",
            workHours: 0,
            checkIn: null,
            checkOut: null,
          });
          leaveRecords.push(record);
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      message: "Leave applied successfully",
      records: leaveRecords,
    });
  } catch (err) {
    console.error("Leave application error:", err);
    res.status(500).json({ message: "Failed to apply for leave", error: err.message });
  }
});

// Get user's leave records
router.get("/my-leaves", authMiddleware, async (req, res) => {
  try {
    const leaves = await Attendance.find({
      userId: req.user.id,
      status: "Leave",
    }).sort({ date: -1 });

    res.json(leaves);
  } catch (err) {
    console.error("Fetch leaves error:", err);
    res.status(500).json({ message: "Failed to fetch leave records", error: err.message });
  }
});

export default router;