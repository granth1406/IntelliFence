const Location = require("../models/Location.js");
const Zone = require("../models/Zone.js");
const { isPointInsideZone, distanceBetweenPoints } = require("../utils/geofence.js");


async function updateLocation(req, res) {

  try {

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and Longitude required" });
    }

    const location = await Location.create({
      user: req.user.id,
      latitude,
      longitude
    });

    const io = req.app.get("io");

    // broadcast location update
    io.emit("location-update", {
      userId: req.user.id,
      latitude,
      longitude
    });


    // fetch approved zones
    const zones = await Zone.find({ status: "approved" });


    zones.forEach(zone => {

      const inside = isPointInsideZone(
        { latitude, longitude },
        zone.coordinates
      );


      if (inside) {

        io.emit("zone-entered", {
          userId: req.user.id,
          zoneId: zone._id,
          zoneName: zone.name,
          riskLevel: zone.riskLevel
        });

        return;
      }


      // check near-zone alert
      const firstPoint = zone.coordinates[0];

      const distance = distanceBetweenPoints(
        latitude,
        longitude,
        firstPoint.latitude,
        firstPoint.longitude
      );


      if (distance < 100) {

        io.emit("near-zone-alert", {
          userId: req.user.id,
          zoneId: zone._id,
          zoneName: zone.name,
          distance
        });

      }

    });


    res.json({
      message: "Location updated",
      location
    });

  }
  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

}



async function getUserLocations(req, res) {

  try {

    const locations = await Location.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.json(locations);

  }
  catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};

module.exports = {
  updateLocation,
  getUserLocations
};