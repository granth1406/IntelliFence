const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type : String,
        enum: ['SOS', 'Report'],
        default: "SOS"
    },
    description: {
        type: String
    },
    location: {
        latitude : Number,
        longitude : Number
    },
    status: {
        type: String,
        enum: ["pending","responding", "resolved"],
        default: "pending"
    }
}, {timestamps: true});

const Incident = mongoose.model("Incident", incidentSchema);
module.exports = Incident;