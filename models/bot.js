import mongoose from "mongoose";

const botSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
	},
	description: {
		type: String,
		required: true,
		trim: true,
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	status: {
		type: String,
		enum: ["pending", "processing", "ready", "failed"],
		default: "pending",
	},
	isShareable: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	},
});

botSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

const Bot = mongoose.model("Bot", botSchema);
export default Bot;
