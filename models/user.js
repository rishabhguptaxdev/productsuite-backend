import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: [true, "Please provide email"],
			validate: [validator.isEmail, "Please provide valid email"],
			unique: true,
		},
		auth0Id: {
			type: String,
			unique: true,
			required: true,
		},
		role: {
			type: String,
			default: "user",
		},
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
