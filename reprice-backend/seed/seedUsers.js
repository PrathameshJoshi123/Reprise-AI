const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected (seedUsers)");

    await User.deleteMany();

    await User.create({
      name: "Agent A",
      email: "agentA@test.com",
      role: "agent",
      totalJobs: 2,
      rating: 4.8
    });

    console.log("✅ Agent seeded");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

run();
