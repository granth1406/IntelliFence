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
    createdAt:{
        type: Date,
        default: Date.now
    }
});
//name, email, password, role, createdAt

const User = mongoose.model('User', userSchema);
module.exports = User;