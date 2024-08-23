const CustomError = require("../utils/customErrors");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// exports.isLoggedIn = async (req, res, next) => {
//   try {
//     const token =
//       req?.cookies?.token ||
//       req.header("Authorization")?.replace("Bearer ", "") ||
//       req.body?.token;

//     if (!token) {
//       return next(new CustomError("User is not loggedIn", 401));
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     req.user = await User.findById(decoded.id);

//     next();
//   } catch (error) {
//     console.error(
//       "Something went wrong while verifying user loggedIn status",
//       error
//     );
//     res.json({ success: false, message: error.message });
//   }
// };


exports.isLoggedIn = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.body?.token

    if (!token) {
      return next(new CustomError("User is not logged in", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new CustomError("User not found", 404));
    }

    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
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
