const mongoose = require("mongoose");

const DeviceSchema = new mongoose.Schema({
  brand: String,
  model: String,
  category: String, // Phone / Laptop
  basePrice: Number
});

module.exports = mongoose.model("Device", DeviceSchema);
