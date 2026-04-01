import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import User from "./models/User.js";
import Attendance from "./models/Attendance.js";

import authRoutes from "./routes/authRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/admin", adminRoutes);


app.get("/", (req, res) => {
  res.send("API Running...");
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB Connected"))
.catch(err => console.log(err));
// "55 23 * * *"

cron.schedule("55 23 * * *", async () => {
  console.log("Running Midnight Cleanup (Absentees & Forgotten Check-outs)...");
  
  try {
    const today = new Date().toISOString().split("T")[0];
    const allEmployees = await User.find({ role: "employee" });

    for (let emp of allEmployees) {
      const record = await Attendance.findOne({ userId: emp._id, date: today });

      // CASE 1: User never checked in (Absent)
      if (!record) {
        await Attendance.create({
          userId: emp._id,
          date: today,
          status: "Absent",
          workHours: 0,
          checkIn: null,
          checkOut: null
        });
        console.log(`[ABSENT] Marked ${emp.email}`);
      } 
      
      // CASE 2: User checked in but FORGOT to check out (Auto-Checkout)
      else if (record.checkIn && !record.checkOut) {
        // We set the checkout time to 6:00 PM (18:00) as per your office rules
        const forcedOutTime = new Date(record.checkIn);
        forcedOutTime.setHours(18, 0, 0, 0); 

        // Calculate hours worked (from Check-in until 6:00 PM)
        const diffInMs = forcedOutTime - new Date(record.checkIn);
        const hours = (diffInMs / (1000 * 60 * 60)).toFixed(2);

        record.checkOut = forcedOutTime;
        record.workHours = parseFloat(hours > 0 ? hours : 0); // Ensure no negative hours
        
        await record.save();
        console.log(`[AUTO-OUT] Closed session for ${emp.email} at 6:00 PM`);
      }
    }
  } catch (err) {
    console.error("Cron Error during cleanup:", err);
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));