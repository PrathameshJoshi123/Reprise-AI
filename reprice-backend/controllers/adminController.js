const Job = require("../models/Job");
const User = require("../models/User");

exports.getDashboardStats = async (req, res) => {
  const activePickups = await Job.countDocuments({
    status: { $in: ["Agent on Way", "Inspecting"] }
  });

  const totalDevicesCollected = await Job.countDocuments();

  const payouts = await Job.aggregate([
    { $match: { status: "Completed" } },
    { $group: { _id: null, total: { $sum: "$finalPrice" } } }
  ]);

  res.json({
    activePickups,
    totalDevicesCollected,
    totalPayouts: payouts[0]?.total || 0,
    aiAccuracy: 94.2
  });
};

exports.getJobs = async (req, res) => {
  const jobs = await Job.find()
    .populate("assignedAgent", "name")
    .sort({ createdAt: -1 })
    .limit(10);

  res.json(jobs);
};

// 1️⃣ Get Job Details
exports.getJobDetails = async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findOne({ jobId })
    .populate("assignedAgent", "name email");

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  res.json(job);
};

// 2️⃣ Override Final Price
exports.overridePrice = async (req, res) => {
  const { jobId } = req.params;
  const { finalPrice } = req.body;

  if (!finalPrice) {
    return res.status(400).json({ message: "Final price is required" });
  }

  const job = await Job.findOne({ jobId });

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  job.finalPrice = finalPrice;
  await job.save();

  res.json({
    message: "Price overridden successfully",
    job
  });
};

// 1️⃣ Agent Leaderboard
exports.getAgentLeaderboard = async (req, res) => {
  const agents = await User.find({ role: "agent" })
    .select("name rating totalJobs")
    .sort({ totalJobs: -1 });

  res.json(agents);
};

// 2️⃣ Get Agent Locations (for map)
exports.getAgentLocations = async (req, res) => {
  const agents = await User.find({ role: "agent" })
    .select("name location");

  res.json(agents);
};
