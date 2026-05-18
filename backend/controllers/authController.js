const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
async function registerUser(req,res){
  try{

    const {name,email,password} = req.body;

    const existingUser = await User.findOne({email});

    if(existingUser){
      return res.status(400).json({
        message:"Enter valid email address"
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
      { expiresIn:"15m" } // shorter for access token
    );

    const refreshToken = jwt.sign(
      {
        id:user._id
      },
      process.env.JWT_SECRET,
      { expiresIn:"7d" }
    );

    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(200).json({
      message:"Login successful",
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role
      }
    });

  }catch(error){
    res.status(500).json({message:error.message});
  }

}

// REFRESH TOKEN
async function refreshToken(req,res){
  try{
    const { refreshToken } = req.body;

    if(!refreshToken){
      return res.status(401).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if(!user){
      return res.status(401).json({ message: "User not found" });
    }

    // Check if refresh token is valid
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if(!tokenExists){
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newToken = jwt.sign(
      {
        id:user._id,
        role:user.role
      },
      process.env.JWT_SECRET,
      { expiresIn:"15m" }
    );

    res.status(200).json({
      message:"Token refreshed",
      token: newToken
    });

  }catch(error){
    res.status(500).json({message:error.message});
  }
}

// LOGOUT
async function logoutUser(req,res){
  try{
    const { refreshToken } = req.body;

    if(!refreshToken){
      return res.status(400).json({ message: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if(user){
      // Remove the refresh token
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });

  }catch(error){
    res.status(500).json({message:error.message});
  }
}

// GET CURRENT USER
async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// UPDATE CURRENT USER PROFILE
async function updateCurrentUser(req, res) {
  try {
    const { name, email, bio, avatarUrl } = req.body;

    const update = {};
    if (typeof name === "string") update.name = name.trim();
    if (typeof email === "string") update.email = email.trim();
    if (typeof bio === "string") update.bio = bio;
    if (typeof avatarUrl === "string") update.avatarUrl = avatarUrl;

    if (update.email) {
      const existing = await User.findOne({ email: update.email, _id: { $ne: req.user.id } });
      if (existing) {
        return res.status(409).json({ message: "Email is already in use" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// GET USER SETTINGS
async function getSettings(req, res) {
  try {
    const user = await User.findById(req.user.id).select('settings');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// UPDATE USER SETTINGS
async function updateSettings(req, res) {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Invalid settings format" });
    }

    const update = {};
    if (typeof settings.pushAlerts === "boolean") update["settings.pushAlerts"] = settings.pushAlerts;
    if (typeof settings.emailSummary === "boolean") update["settings.emailSummary"] = settings.emailSummary;
    if (typeof settings.autoOpenMap === "boolean") update["settings.autoOpenMap"] = settings.autoOpenMap;
    if (typeof settings.compactMode === "boolean") update["settings.compactMode"] = settings.compactMode;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('settings');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ settings: user.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getCurrentUser,
  updateCurrentUser,
  getSettings,
  updateSettings
};