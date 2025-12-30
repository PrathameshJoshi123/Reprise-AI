const User = require("../models/User");

// Agent updates their live location
exports.updateLocation = async (req, res) => {
  const { agentId, lat, lng } = req.body;

  if (!agentId || !lat || !lng) {
    return res.status(400).json({ message: "Missing data" });
  }

  const agent = await User.findById(agentId);

  if (!agent) {
    return res.status(404).json({ message: "Agent not found" });
  }

  agent.location = { lat, lng };
  await agent.save();

  res.json({ message: "Location updated" });
};
