const express = require("express");
const {reportIncident, getIncidents} = require("../controllers/incidentController.js");

const router = express.Router();

router.post("/",reportIncident);
router.get("/",getIncidents);

module.exports = router;