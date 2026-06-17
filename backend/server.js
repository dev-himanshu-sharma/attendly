import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";

import User from "./models/User.js";
import Attendance from "./models/Attendance.js";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import biometricRoutes from "./routes/biometricRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/admin", adminRoutes);
app.use("/biometric", biometricRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

// Check environment variables
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);

// Connect to database
connectDB();

// TEST EMAIL ROUTE
import { sendEmail } from "./config/email.js";

app.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "Hello from Attendance App!",
      html: "<h2>Hello from Attendance App!</h2>",
    });

    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Email failed",
      error: err.message,
    });
  }
});

// Midnight cleanup
cron.schedule("55 23 * * *", async () => {
  console.log(
    "Running Midnight Cleanup (Absentees & Forgotten Check-outs)..."
  );

  try {
    const today = new Date().toISOString().split("T")[0];
    const allEmployees = await User.find({ role: "employee" });

    for (let emp of allEmployees) {
      const record = await Attendance.findOne({
        userId: emp._id,
        date: today,
      });

      if (!record) {
        await Attendance.create({
          userId: emp._id,
          date: today,
          status: "Absent",
          workHours: 0,
          checkIn: null,
          checkOut: null,
        });

        console.log(`[ABSENT] Marked ${emp.email}`);
      } else if (record.checkIn && !record.checkOut) {
        const forcedOutTime = new Date(record.checkIn);
        forcedOutTime.setHours(18, 0, 0, 0);

        const diffInMs = forcedOutTime - new Date(record.checkIn);
        const hours = (diffInMs / (1000 * 60 * 60)).toFixed(2);

        record.checkOut = forcedOutTime;
        record.workHours = parseFloat(hours > 0 ? hours : 0);

        await record.save();

        console.log(
          `[AUTO-OUT] Closed session for ${emp.email} at 6:00 PM`
        );
      }
    }
  } catch (err) {
    console.error("Cron Error:", err);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});