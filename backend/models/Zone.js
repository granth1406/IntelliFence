const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },

    riskLevel: {
        type:String,
        enum: ["none", "low", "medium", "high"],
        default: "none"
    },

    coordinates:[{
        latitude: Number,
        longitude: Number
    }],

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});

const Zone = mongoose.model("Zone", zoneSchema);
module.exports = Zone;