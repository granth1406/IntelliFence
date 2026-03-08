const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
async function registerUser(req,res){
  try{

    const {name,email,password} = req.body;

    const existingUser = await User.findOne({email});

    if(existingUser){
      return res.status(409).json({
        message:"User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const user = await User.create({
      name,
      email,
      password:hashedPassword,
      role:"user" // force default role
    });

    res.status(201).json({
      message:"User registered",
      userId:user._id,
      role:user.role
    });

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


// LOGIN
async function loginUser(req,res){
  try{

    const {email,password} = req.body;

    const user = await User.findOne({email});

    if(!user){
      return res.status(401).json({
        message:"Invalid email or password"
      });
    }

    const isPasswordValid = await bcrypt.compare(password,user.password);

    if(!isPasswordValid){
      return res.status(401).json({
        message:"Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id:user._id,
        role:user.role
      },
      process.env.JWT_SECRET,
      { expiresIn:"7d" }
    );

    res.status(200).json({
      message:"Login successful",
      token
    });

  }catch(error){
    res.status(500).json({message:error.message});
  }

}


module.exports = {
  registerUser,
  loginUser
};