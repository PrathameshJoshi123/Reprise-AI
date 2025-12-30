const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getJobs,
  getJobDetails,
  overridePrice,
  getAgentLeaderboard,
  getAgentLocations
} = require("../controllers/adminController");


const Device = require("../models/Device");

router.get("/devices", async (req, res) => {
  const devices = await Device.find().limit(50);
  res.json(devices);
});


router.get("/dashboard-stats", getDashboardStats);
router.get("/jobs", getJobs);
// Job details
router.get("/jobs/:jobId", getJobDetails);

// Price override
router.patch("/jobs/:jobId/override-price", overridePrice);

// Agent leaderboard
router.get("/agents/leaderboard", getAgentLeaderboard);

// Agent locations (map)
router.get("/agents/locations", getAgentLocations);

module.exports = router;
