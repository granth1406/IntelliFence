const Zone = require("../models/Zone.js");

async function createZone(req,res){
    try{
        const { name, riskLevel, coordinates} = req.body;
        const zone = await Zone.create({
            name, riskLevel, coordinates, createdBy: req.user.id
        });

        res.status(201).json(zone);

    }catch(error){
        res.status(500).json({message: error.message});
    }
};

async function getZones(req,res){
    try{
        const zones = await Zone.find();
        res.json(zones);
    }catch(error){
        res.status(500).json({message : error.message});
    }
}

module.exports = {getZones,createZone};