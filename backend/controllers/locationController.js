const Location = require("../models/Location.js");

async function getUserLocations(req,res){
    try{
        const locations = await Location.find({user: req.user.id});
        res.json(locations);
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

async function updateLocation(req,res){
    try{
        const {latitude, longitude} = req.body;
        const location = await Location.create({
            user: req.user.id,
            latitude,
            longitude
        });

        res.json({
            message: "Location updated",
            location
        });
    }catch(error){
        res.status(500).json({message: error.message});
    }
};

module.exports = {updateLocation, getUserLocations};