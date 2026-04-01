import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fromDate: String,
  toDate: String,
  reason: String,
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
});

export default mongoose.model("Leave", leaveSchema);