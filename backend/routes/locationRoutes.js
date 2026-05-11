const express = require("express");
const {getUserLocations, updateLocation} = require("../controllers/locationController.js");
const authMiddleware = require("../middleware/authMiddleware.js");

const router = express.Router();

// protect location endpoints - they rely on `req.user`
router.post('/update', authMiddleware, updateLocation);
router.get('/live', authMiddleware, getUserLocations);

module.exports = router;
