const Incident = require("../models/Incident.js");

async function reportIncident(req,res){
    try{
        const {latitude, longitude, description} = req.body;
        
        const incident = await Incident.create({
            user : req.user._id,
            location: {latitude, longitude},
            description
        });

        const io = req.app.get("io");
        io.emit("incident-reported",incident);

        res.status(201).json({
            message: "Incident reported",
            incident
        });

    }catch(error){
        res.status(500).json({message: error.message});
    }
};

async function getIncidents(req,res){
    try{
        const incidents = await Incident.find().populate("user", "name email");
        res.json(incidents);
    }catch(error){
        res.status(500).json({ message: error.message });
    }
};

module.exports = {getIncidents, reportIncident};