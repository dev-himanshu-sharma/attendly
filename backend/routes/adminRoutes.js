import express from "express";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get all users
router.get("/users", authMiddleware, isAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Get all attendance
router.get("/attendance", authMiddleware, isAdmin, async (req, res) => {
  const records = await Attendance.find().populate("userId", "name email role");
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