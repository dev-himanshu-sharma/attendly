import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  date: { 
    type: String, 
    required: true // e.g., "2026-03-20"
  },
  checkIn: { 
    type: Date // Changed from String to Date for precise math
  },
  checkOut: { 
    type: Date // Changed from String to Date
  },
  workHours: { 
    type: Number, 
    default: 0 // New field to store the calculated duration
  },
  status: {
    type: String,
    enum: ["Present", "Absent","Late","Half-day","Leave"],
    default: "Present"
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

export default mongoose.model("Attendance", attendanceSchema);