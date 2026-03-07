const Zone = require("../models/Zone");
const User = require("../models/User");
const Location = require("../models/Location");


// create incident
async function createZone(req,res){

  try{

    const {title,description,latitude,longitude,riskLevel} = req.body;

    const zone = await Zone.create({
      createdBy:req.user.id,
      title,
      description,
      latitude,
      longitude,
      riskLevel,
      type:"incident",
      status:"pending"
    });

    const io = req.app.get("io");

    io.emit("zone-created",zone);

    // notify nearby users
    const radius = 0.003;

    const nearbyUsers = await Location.find({
      latitude:{ $gte: latitude-radius, $lte: latitude+radius },
      longitude:{ $gte: longitude-radius, $lte: longitude+radius }
    });

    io.emit("zone-verification-request",{
      zoneId:zone._id,
      latitude,
      longitude,
      users:nearbyUsers.map(u=>u.user)
    });

    res.status(201).json(zone);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// get verified zones
async function getZones(req,res){

  try{

    const zones = await Zone.find({
      type:"zone",
      status:"verified"
    });

    res.json(zones);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// get incidents
async function getIncidents(req,res){

  try{

    const incidents = await Zone.find({
      type:"incident"
    });

    res.json(incidents);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// verification
async function verifyZone(req,res){

  try{

    const {zoneId,response} = req.body;

    const zone = await Zone.findById(zoneId);

    if(!zone){
      return res.status(404).json({message:"Zone not found"});
    }

    const user = await User.findById(req.user.id);

    const trustScore = user.trustScore || 1;

    const voted = zone.confirmations.find(
      c=>c.user.toString()===req.user.id
    );

    if(voted){
      return res.status(400).json({message:"Already voted"});
    }

    zone.confirmations.push({
      user:req.user.id,
      response
    });

    if(response==="confirm"){
      zone.verificationScore += trustScore;
    }else{
      zone.verificationScore -= trustScore;
    }

    if(zone.verificationScore >=5){

      zone.status="verified";

      if(zone.type==="incident"){
        zone.type="zone";
      }

    }

    if(zone.verificationScore <= -3){
      zone.status="false";
    }

    await zone.save();

    const io = req.app.get("io");

    io.emit("zone-updated",zone);

    res.json(zone);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// authority edit
async function updateZone(req,res){

  try{

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );

    const io = req.app.get("io");

    io.emit("zone-updated",zone);

    res.json(zone);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// delete zone
async function deleteZone(req,res){

  try{

    const zone = await Zone.findByIdAndDelete(req.params.id);

    const io = req.app.get("io");

    io.emit("zone-deleted",zone._id);

    res.json({message:"Zone deleted"});

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// authority override
async function approveZone(req,res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    {status:"verified",type:"zone"},
    {new:true}
  );

  res.json(zone);
}


async function rejectZone(req,res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    {status:"false"},
    {new:true}
  );

  res.json(zone);
}


async function pendingZone(req,res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    {status:"pending"},
    {new:true}
  );

  res.json(zone);
}


module.exports={
  createZone,
  getZones,
  getIncidents,
  verifyZone,
  updateZone,
  deleteZone,
  approveZone,
  rejectZone,
  pendingZone
};