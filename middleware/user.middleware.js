const CustomError = require("../utils/CustomErrors");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.isLoggedIn = async (req, res, next) => {
  try {
    const token =
      req?.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.body?.token;

    if (!token) {
      return next(new CustomError("User is not loggedIn", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();
  } catch (error) {
    console.error(
      "Something went wrong while verifying user loggedIn status",
      error
    );
    res.json({ success: false, message: error.message });
  }
};

exports.customRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError("You are not allowed to access this resource ", 402)
      );
    }
    next();
  };
};
