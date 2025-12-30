const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const Device = require("../models/Device");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const devices = [];

fs.createReadStream("final_mobile_master_data (1).csv")
  .pipe(csv())
  .on("data", (row) => {
    devices.push({
      brand: row.Brand || row.brand,
      model: row.Model || row.model,
      category: "Phone",
      basePrice: Number(row.Price || row.price || 0)
    });
  })
  .on("end", async () => {
    await Device.deleteMany();
    await Device.insertMany(devices);
    console.log("✅ Devices imported:", devices.length);
    process.exit();
  });
