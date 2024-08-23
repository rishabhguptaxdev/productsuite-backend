const User = require("../models/user");
const sendToken = require("../utils/sendToken");
const jwt = require('jsonwebtoken')

exports.signup = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "email, or password is missing",
      });
    }

    if (email && (await User.findOne({ email }))) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists" });
    }

    const user = await User.create({
      email,
      password,
      role,
    });

    sendToken(user, res);
  } catch (error) {
    console.error("Something went wrong while signup", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        success: false,
        message: "Email or passowrd is missing",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "user is not registered" });
    }

    const isValidPassword = await user.isValidPassword(password);

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Password is invalid" });
    }

    sendToken(user, res);
  } catch (error) {
    console.error("Something went wrong while login", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.signupOrLogin = async (req, res, next) => {
  try {
    const { email, auth0Id, role } = req.body;

    if(!email || !auth0Id) {
      res.status(401).json({ success: false, message: "email or auth0Id is not found" });
      return
    }
    // Check if user exists based on OAuth2 ID (auth0Id)
    let user = await User.findOne({ auth0Id });
    
    // If user does not exist, create a new user in the database
    if (!user) {
      user = await User.create({
        email,
        auth0Id: auth0Id,
        role: role || "user",
      });
    }

    // Generate JWT Token for your app
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });

    // Return token and user info
    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error("Error during OAuth2 signup/login:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};