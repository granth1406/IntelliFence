const express = require("express");
const {createZone, getZones, updateZone, deleteZone, approveZone, rejectZone, pendingZone} = require("../controllers/zoneController");

const router = express.Router();

router.post("/", createZone);
router.put("/:id", updateZone);
router.delete("/:id", deleteZone);
router.patch("/:id/approve", approveZone);
router.patch("/:id/reject", rejectZone);
router.patch("/:id/pending", pendingZone);

module.exports = router;