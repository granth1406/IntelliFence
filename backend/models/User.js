const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    bio: {
        type: String,
        default: ""
    },
    avatarUrl: {
        type: String,
        default: ""
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['user', 'authority'],
        default: 'user'
    },
    settings: {
        pushAlerts: { type: Boolean, default: true },
        emailSummary: { type: Boolean, default: false },
        autoOpenMap: { type: Boolean, default: true },
        compactMode: { type: Boolean, default: false }
    },
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt:{
        type: Date,
        default: Date.now
    },
    trustScore: {
        type: Number,
        default: 1
    }

},{timestamps:true});
//name, email, password, role, createdAt

const User = mongoose.model('User', userSchema);
module.exports = User;