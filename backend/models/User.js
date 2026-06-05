import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    unique: true,
    required: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please enter a valid email address"
    ]
  },

  password: {
    type: String,
    required: true,
  
  },

  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee"
  }
});

export default mongoose.model("User", userSchema);