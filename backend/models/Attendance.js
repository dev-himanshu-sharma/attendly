import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  checkIn: { 
    type: Date 
  },
  checkOut: { 
    type: Date
  },
  workHours: {
    type: Number,
    default: 0
  },
  biometricCheckIn: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["Present", "Absent", "Late", "Half-day", "Leave"],
    default: "Present"
  }
}, { timestamps: true }); 
export default mongoose.model("Attendance", attendanceSchema);