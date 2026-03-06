const express = require("express");
const {getUserLocations, updateLocation} = require("../controllers/locationController.js");

const router = express.Router();

router.post('/update', updateLocation);
router.get('/live', getUserLocations);

module.exports = router;
