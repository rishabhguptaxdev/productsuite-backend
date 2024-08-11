const User = require("../models/User");
const sendToken = require("../utils/sendToken");

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
