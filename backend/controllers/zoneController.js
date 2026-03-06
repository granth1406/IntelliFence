const Zone = require("../models/Zone.js");

async function createZone(req,res){
    try{
        const { name, riskLevel, coordinates} = req.body;
        const zone = await Zone.create({
            name, riskLevel, coordinates, createdBy: req.user.id
        });

        const io = req.app.get("io");
        io.emit("zone-created", zone);

        res.status(201).json(zone);

    }catch(error){
        res.status(500).json({message: error.message});
    }
};

async function getZones(req,res){
    try{

        const zones = await Zone.find({
            status: { $ne: "rejected" }
        });

        res.json(zones);

    }catch(error){
        res.status(500).json({message : error.message});
    }
}

async function updateZone(req, res){
  try {
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    const io = req.app.get("io");
    io.emit("zone-updated", zone);

    res.json(zone);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

 async function deleteZone(req, res){
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");
    io.emit("zone-deleted", zone._id);

    res.json({ message: "Zone deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function approveZone(req, res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  const io = req.app.get("io");
  io.emit("zone-approved", zone);

  res.json(zone);

};

async function rejectZone(req, res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    { status: "rejected" },
    { new: true }
  );

  const io = req.app.get("io");
  io.emit("zone-rejected", zone);

  res.json(zone);

};

async function pendingZone(req, res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    { status: "pending" },
    { new: true }
  );

  const io = req.app.get("io");
  io.emit("zone-pending", zone);

  res.json(zone);

};

module.exports = {getZones, createZone, updateZone, deleteZone, rejectZone, pendingZone, approveZone};