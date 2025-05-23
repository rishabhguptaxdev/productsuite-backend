import jwt from "jsonwebtoken";
import User from "../models/user.js";
import CustomError from "../utils/customErrors.js";
import config from "../config/app.config.js";

// Middleware: Check if user is logged in
export const isLoggedIn = async (req, res, next) => {
	try {
		const token =
			req.header("Authorization")?.replace("Bearer ", "") || req.body?.token;

		if (!token) {
			return next(new CustomError("User is not logged in", 401));
		}

		const decoded = jwt.verify(token, config.jwt.secret);
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

// Middleware: Check if user has required role
export const customRole = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new CustomError("You are not allowed to access this resource", 403)
			);
		}
		next();
	};
};

export const optionalAuth = async (req, res, next) => {
	try {
		const token =
			req.header("Authorization")?.replace("Bearer ", "") || req.body?.token;

		if (!token || token == "null") return next(); // continue as anonymous

		const decoded = jwt.verify(token, config.jwt.secret);
		req.user = await User.findById(decoded.id);

		next();
	} catch (error) {
		console.warn("Invalid or missing token. Continuing as guest.");
		next(); // Don't block unauthenticated users
	}
};
