const mongoose = require("mongoose");
const Job = require("../models/Job");
const User = require("../models/User");
require("dotenv").config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected (seedJobs)");

    await Job.deleteMany();

    const agent = await User.findOne({ role: "agent" });

    if (!agent) {
      throw new Error("No agent found. Seed users first.");
    }

    await Job.insertMany([
      {
        jobId: "PK-001",
        customerName: "Rahul Sharma",
        deviceModel: "iPhone 13 Pro",
        assignedAgent: agent._id,
        status: "Inspecting",
        aiPrice: 44000,
        finalPrice: 42000
      },
      {
        jobId: "PK-002",
        customerName: "Priya Patel",
        deviceModel: "MacBook Air M1",
        assignedAgent: agent._id,
        status: "Completed",
        aiPrice: 56000,
        finalPrice: 55000
      }
    ]);

    console.log("✅ Jobs seeded");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

run();
