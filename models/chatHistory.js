const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
	bot: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Bot",
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	question: {
		type: String,
		required: true,
	},
	answer: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	metadata: {
		type: Object,
		default: {},
	},
});

// Index for faster querying
chatHistorySchema.index({ bot: 1, user: 1, timestamp: -1 });

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
