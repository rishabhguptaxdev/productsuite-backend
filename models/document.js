const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
	filename: {
		type: String,
		required: true,
	},
	path: {
		type: String,
		required: true,
	},
	bot: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Bot",
		required: true,
	},
	status: {
		type: String,
		enum: ["processing", "processed", "failed"],
		default: "processing",
	},
	processedAt: {
		type: Date,
	},
	uploadedAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Document", documentSchema);
