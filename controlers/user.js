import jwt from "jsonwebtoken";
import User from "../models/user.js";
import sendToken from "../utils/sendToken.js";

// Signup controller
export const signup = async (req, res) => {
	try {
		const { email, password, role } = req.body;

		if (!email || !password) {
			return res.status(401).json({
				success: false,
				message: "Email or password is missing",
			});
		}

		if (email && (await User.findOne({ email }))) {
			return res
				.status(401)
				.json({ success: false, message: "User already exists" });
		}

		const user = await User.create({ email, password, role });
		sendToken(user, res);
	} catch (error) {
		console.error("Something went wrong during signup:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Login controller
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(401).json({
				success: false,
				message: "Email or password is missing",
			});
		}

		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res
				.status(401)
				.json({ success: false, message: "User is not registered" });
		}

		const isValidPassword = await user.isValidPassword(password);
		if (!isValidPassword) {
			return res
				.status(401)
				.json({ success: false, message: "Password is invalid" });
		}

		sendToken(user, res);
	} catch (error) {
		console.error("Something went wrong during login:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Signup or login (OAuth2)
export const signupOrLogin = async (req, res) => {
	try {
		const { email, auth0Id, role } = req.body;

		if (!email || !auth0Id) {
			return res
				.status(401)
				.json({ success: false, message: "Email or auth0Id is missing" });
		}

		let user = await User.findOne({ auth0Id });

		if (!user) {
			user = await User.create({
				email,
				auth0Id,
				role: role || "user",
			});
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRY,
		});

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
