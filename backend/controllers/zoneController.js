const Zone = require("../models/Zone");
const User = require("../models/User");
const Location = require("../models/Location");
const CaseRecord = require("../models/CaseRecord");


// Incident type to radius mapping
const INCIDENT_RADIUS = {
  accident: 0.001,
  traffic_jam: 0.002,
  crime: 0.003,
  suspicious_activity: 0.002,
  medical_emergency: 0.004,
  natural_disaster: 0.01,
  other: 0.003
};

// create incident
async function createZone(req,res){

  try{

    const {title,description,latitude,longitude,riskLevel, incidentType} = req.body;

    const existingQuery = {
      type: "incident",
      latitude: { $gte: latitude - 0.0005, $lte: latitude + 0.0005 },
      longitude: { $gte: longitude - 0.0005, $lte: longitude + 0.0005 },
      status: "pending",
    };

    // only treat as duplicate if the incidentType matches (allow different incident types nearby)
    if (incidentType) existingQuery.incidentType = incidentType;

    const existing = await Zone.findOne(existingQuery);

     if(existing){
      return res.status(409).json({
        message:"Incident already reported nearby"
      });
    }

    const zone = await Zone.create({
      createdBy: req.user.id,
      title,
      description,
      latitude,
      longitude,
      riskLevel,
      incidentType: incidentType || "other",
      radius: INCIDENT_RADIUS[incidentType] || INCIDENT_RADIUS.other,
      type: "incident",
      status: "pending",
      approved: false,
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


// get verified zones (for public map display)
async function getZones(req,res){

  try{

    const zones = await Zone.find({
      status: { $in: ["approved", "verified_by_users"] },
      type:"zone"
    });

    res.json(zones);

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// get incidents (for user dashboard with filters)
async function getIncidents(req,res){

  try{

    const { approved, status } = req.query;

    let filter = { type: "incident" };

    if (approved !== undefined) {
      filter.approved = approved === 'true';
    }

    if (status) {
      filter.status = status;
    }

    const incidents = await Zone.find(filter);

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


async function archiveZoneAsCase(zone, caseStatus, handledBy) {
  await CaseRecord.create({
    originalZoneId: zone._id,
    caseStatus,
    handledBy,
    zoneSnapshot: {
      title: zone.title,
      description: zone.description,
      incidentType: zone.incidentType,
      riskLevel: zone.riskLevel,
      latitude: zone.latitude,
      longitude: zone.longitude,
      radius: zone.radius,
      status: zone.status,
      approved: zone.approved,
      createdAt: zone.createdAt,
      updatedAt: zone.updatedAt,
    },
  });
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
    {status:"approved", approved: true, type:"zone"},
    {new:true}
  );

  const io = req.app.get("io");
  io.emit("zone-approved", zone);

  res.json(zone);
}


async function rejectZone(req,res){

  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    await archiveZoneAsCase(zone, "denied", req.user.id);
    await Zone.findByIdAndDelete(zone._id);

    const io = req.app.get("io");
    io.emit("zone-denied", { ...zone.toObject(), status: "denied", approved: false });
    io.emit("zone-deleted", zone._id);

    res.json({ message: "Zone denied and archived as case", caseStatus: "denied", zoneId: zone._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function resolveZone(req,res){
  try {
    const zone = await Zone.findById(req.params.id);

    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    await archiveZoneAsCase(zone, "resolved", req.user.id);
    await Zone.findByIdAndDelete(zone._id);

    const io = req.app.get("io");
    io.emit("zone-resolved", { ...zone.toObject(), status: "resolved" });
    io.emit("zone-deleted", zone._id);

    res.json({ message: "Zone resolved and archived as case", caseStatus: "resolved", zoneId: zone._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function pendingZone(req,res){

  const zone = await Zone.findByIdAndUpdate(
    req.params.id,
    {status:"pending"},
    {new:true}
  );

  res.json(zone);
}


// Report incident with quick options
async function reportIncident(req, res) {
  try {
    const { incidentType, title, description, latitude, longitude, riskLevel } = req.body;

    const existingQuery = {
      type: "incident",
      latitude: { $gte: latitude - 0.0005, $lte: latitude + 0.0005 },
      longitude: { $gte: longitude - 0.0005, $lte: longitude + 0.0005 },
      status: "pending",
    };

    if (incidentType) existingQuery.incidentType = incidentType;

    const existing = await Zone.findOne(existingQuery);

    if (existing) {
      return res.status(409).json({
        message: "Incident already reported nearby"
      });
    }

    const radius = INCIDENT_RADIUS[incidentType] || INCIDENT_RADIUS.other;

    const zone = await Zone.create({
      createdBy: req.user.id,
      title,
      description,
      latitude,
      longitude,
      riskLevel,
      incidentType,
      radius,
      type: "incident",
      status: "pending",
      approved: false
    });

    const io = req.app.get("io");

    // Emit zone-created for unapproved zone alert
    io.emit("zone-created", zone);

    // Notify nearby users about unapproved incident
    const nearbyUsers = await Location.find({
      latitude: { $gte: latitude - radius, $lte: latitude + radius },
      longitude: { $gte: longitude - radius, $lte: longitude + radius }
    });

    io.emit("unapproved-zone-alert", {
      zoneId: zone._id,
      incidentType,
      latitude,
      longitude,
      title,
      description,
      riskLevel,
      users: nearbyUsers.map(u => u.user)
    });

    res.status(201).json(zone);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// User response to "Are you okay?" alert
async function userResponse(req, res) {
  try {
    const { response } = req.body; // "ok" or "not_ok"
    const zoneId = req.params.id;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ message: "Zone not found" });
    }

    // Check if user already responded
    const existingResponse = zone.userResponses.find(
      r => r.user.toString() === req.user.id
    );

    if (existingResponse) {
      return res.status(400).json({ message: "Already responded to this zone" });
    }

    zone.userResponses.push({
      user: req.user.id,
      response
    });

    await zone.save();

    const io = req.app.get("io");

    // Count responses
    const okCount = zone.userResponses.filter(r => r.response === "ok").length;
    const notOkCount = zone.userResponses.filter(r => r.response === "not_ok").length;

    // Notify admin/authorities
    io.emit("admin-notification", {
      zoneId: zone._id,
      type: "user_response",
      okCount,
      notOkCount,
      totalResponses: zone.userResponses.length,
      latestResponse: response,
      userId: req.user.id
    });

    io.emit("user-response-recorded", {
      zoneId: zone._id,
      userId: req.user.id,
      response
    });

    res.json({ message: "Response recorded", okCount, notOkCount });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Bulk approve zones
async function bulkApprove(req, res) {
  try {
    const { zoneIds } = req.body;

    const zones = await Zone.updateMany(
      { _id: { $in: zoneIds }, status: { $ne: "approved" } },
      { status: "approved", approved: true, type: "zone" }
    );

    const updatedZones = await Zone.find({ _id: { $in: zoneIds } });

    const io = req.app.get("io");

    // Emit events for each approved zone
    updatedZones.forEach(zone => {
      io.emit("zone-approved", zone);
    });

    res.json({ message: `${zones.modifiedCount} zones approved`, zones: updatedZones });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Bulk deny zones
async function bulkDeny(req, res) {
  try {
    const { zoneIds } = req.body;

    const zones = await Zone.find({ _id: { $in: zoneIds } });

    await Promise.all(zones.map((zone) => archiveZoneAsCase(zone, "denied", req.user.id)));
    await Zone.deleteMany({ _id: { $in: zoneIds } });

    const io = req.app.get("io");

    // Emit events for each denied zone
    zones.forEach(zone => {
      io.emit("zone-denied", { ...zone.toObject(), status: "denied", approved: false });
      io.emit("zone-deleted", zone._id);
    });

    res.json({ message: `${zones.length} zones denied and archived as cases`, zones });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Bulk resolve zones
async function bulkResolve(req, res) {
  try {
    const { zoneIds } = req.body;

    const zones = await Zone.find({ _id: { $in: zoneIds } });

    await Promise.all(zones.map((zone) => archiveZoneAsCase(zone, "resolved", req.user.id)));
    await Zone.deleteMany({ _id: { $in: zoneIds } });

    const io = req.app.get("io");

    // Emit events for each resolved zone
    zones.forEach(zone => {
      io.emit("zone-resolved", { ...zone.toObject(), status: "resolved" });
      io.emit("zone-deleted", zone._id);
    });

    res.json({ message: `${zones.length} zones resolved and archived as cases`, zones });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


async function getCases(req, res) {
  try {
    const { caseStatus, limit = 50, offset = 0 } = req.query;
    const filter = {};

    if (caseStatus === "resolved" || caseStatus === "denied") {
      filter.caseStatus = caseStatus;
    }

    const cases = await CaseRecord.find(filter)
      .populate("handledBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await CaseRecord.countDocuments(filter);

    res.json({
      cases,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


// Admin dashboard with filters
async function getAdminDashboard(req, res) {
  try {
    const {
      status,
      riskLevel,
      incidentType,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0
    } = req.query;

    let filter = {};

    const statusValues = new Set(["pending", "approved", "denied", "resolved", "verified_by_users", "false"]);
    const riskValues = new Set(["low", "medium", "high"]);
    const incidentValues = new Set(["accident", "traffic_jam", "crime", "suspicious_activity", "medical_emergency", "natural_disaster", "other"]);

    if (typeof status === "string" && statusValues.has(status)) filter.status = status;
    if (typeof riskLevel === "string" && riskValues.has(riskLevel)) filter.riskLevel = riskLevel;
    if (typeof incidentType === "string" && incidentValues.has(incidentType)) filter.incidentType = incidentType;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const zones = await Zone.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Zone.countDocuments(filter);

    // Get summary stats
    const stats = await Zone.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalZones: { $sum: 1 },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          approvedCount: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          deniedCount: { $sum: { $cond: [{ $eq: ["$status", "denied"] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      zones,
      total,
      stats: stats[0] || {
        totalZones: 0,
        pendingCount: 0,
        approvedCount: 0,
        deniedCount: 0,
        resolvedCount: 0
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
  resolveZone,
  pendingZone,
  reportIncident,
  userResponse,
  bulkApprove,
  bulkDeny,
  bulkResolve,
  getCases,
  getAdminDashboard
};