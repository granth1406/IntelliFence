const express = require("express");

const {
  createZone,
  getZones,
  getIncidents,
  verifyZone,
  updateZone,
  deleteZone,
  approveZone,
  rejectZone,
  pendingZone
} = require("../controllers/zoneController");

const createZoneValidation = require("../middleware/zoneDataValidation.js");
const rateLimiter = require("../middleware/rateLimiter.js");
const errorValidation = require("../middleware/errorValidation.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const authorityCheck = require("../middleware/authorityCheck.js");
const router = express.Router();

router.post("/",rateLimiter, createZoneValidation, errorValidation, createZone);
router.get("/zones",getZones);
router.get("/incidents",getIncidents);
router.post("/verify",verifyZone);

router.put("/:id",
  authMiddleware,
  authorityCheck("authority"),
  updateZone
);

router.delete("/:id",
  authMiddleware,
  authorityCheck("authority"),
  deleteZone
);

router.patch("/:id/approve",
  authMiddleware,
  authorityCheck("authority"),
  approveZone
);

router.patch("/:id/reject",
  authMiddleware,
  authorityCheck("authority"),
  rejectZone
);


module.exports = router;