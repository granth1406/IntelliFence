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
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['user', 'authority'],
        default: 'user'
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