const mongoose = require("mongoose");
const User = require("../models/User");
const Job = require("../models/Job");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const seed = async () => {
  await User.deleteMany();
  await Job.deleteMany();

  const agentA = await User.create({
    name: "Agent A",
    email: "a@agent.com",
    role: "agent"
  });

  await Job.create([
    {
      jobId: "PK-001",
      customerName: "Rahul Sharma",
      deviceModel: "iPhone 13 Pro",
      assignedAgent: agentA._id,
      status: "Inspecting",
      aiPrice: 44000,
      finalPrice: 42000
    },
    {
      jobId: "PK-002",
      customerName: "Priya Patel",
      deviceModel: "MacBook Air M1",
      assignedAgent: agentA._id,
      status: "Completed",
      aiPrice: 56000,
      finalPrice: 55000
    }
  ]);

  console.log("Seed data inserted");
  process.exit();
};

seed();
