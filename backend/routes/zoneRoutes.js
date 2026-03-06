const express = require("express");
const {createZone, getZones} = require("../controllers/zoneController");

const router = express.Router();

router.post("/", createZone);
router.get("/", getZones);

module.exports = router;