const express = require("express");
const router = express.Router();
const { updateLocation } = require("../controllers/agentController");

router.post("/location", updateLocation);

module.exports = router;
