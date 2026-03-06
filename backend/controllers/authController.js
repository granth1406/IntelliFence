const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require('fs');


async function registerUser(req,res){
    try{

        const {name,email,password,role} = req.body;

         //Email
        const existingUser = await User.findOne({email}); // 0 or 1
        if(existingUser){ // 1 - user exists so no new creation
            return res.status(409).json({message : "User Already Exists && Go to Login"});
        }

        //Password
        const hashedPassword  = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "New User Registered",
            userId: user._id
        });

        fs.writeFile('user_log.txt', `Registered A User - Name: ${name}, Email: ${email}, Role: ${role}\n`, { flag: 'a' }, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log('User details saved to user_log.txt');
                }
        });

    }catch(error){
        res.status(500).json({message : error.message});
    }
};

async function loginUser(req,res){
    try{
        const {email,password} = req.body;

        //Email
        const user = await User.findOne({
            email
        });
        if(!user){
            return res.status(401).json({message : "User Does Not Exist"});
        }

        //Password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message : "Invalid Password"})
        }

        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {expiresIn : "7d"},
        );

        res.status(200).json({
            message: "Login successful",
            token
        });

        fs.writeFile('./user_log.txt', `User Logged In - Name: ${user.name}, Email: ${email}\n`, { flag: 'a' }, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log('User login details saved to user_log.txt');
                }
        });

    }catch(error){
        res.status(500).json({message : error.message});
    }
};

module.exports = {loginUser, registerUser};
