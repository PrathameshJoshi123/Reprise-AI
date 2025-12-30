const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  jobId: String,
  customerName: String,
  deviceModel: String,

  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["Waiting", "Agent on Way", "Inspecting", "Completed"]
  },

  aiPrice: Number,
  finalPrice: Number,

  notes: String, // optional admin notes

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Job", JobSchema);
