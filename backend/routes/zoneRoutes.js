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
  resolveZone,
  pendingZone,
  reportIncident,
  userResponse,
  bulkApprove,
  bulkDeny,
  bulkResolve,
  getCases,
  getAdminDashboard,
  getUserReports
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

// New incident reporting with quick options
router.post("/report-incident", authMiddleware, rateLimiter, reportIncident);

// User response to alerts
router.post("/:id/user-response", authMiddleware, userResponse);

// Get user's reports
router.get("/user-reports", authMiddleware, getUserReports);

// Bulk actions for admin
router.post("/bulk-approve", authMiddleware, authorityCheck("authority"), bulkApprove);
router.post("/bulk-deny", authMiddleware, authorityCheck("authority"), bulkDeny);
router.post("/bulk-resolve", authMiddleware, authorityCheck("authority"), bulkResolve);

// Admin dashboard with filters
router.get("/admin-dashboard", authMiddleware, authorityCheck("authority"), getAdminDashboard);
router.get("/cases", authMiddleware, authorityCheck("authority"), getCases);

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

router.patch("/:id/resolve",
  authMiddleware,
  authorityCheck("authority"),
  resolveZone
);


module.exports = router;