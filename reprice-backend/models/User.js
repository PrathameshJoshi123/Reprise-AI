const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, enum: ["admin", "agent"] },

  rating: { type: Number, default: 5 },
  totalJobs: { type: Number, default: 0 },

  location: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model("User", UserSchema);
