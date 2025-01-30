const mongoose = require("mongoose");
const User = require("./user");

const surveySchema = new mongoose.Schema(
	{
		surveyId: String,
		title: String,
		description: String,
		questions: [
			{
				question: String,
				response: String,
			},
		],
		max_questions: Number,
		user: {
			type: mongoose.Types.ObjectId,
			ref: "User",
			required: [true, "User is not loggedin"],
		},
		isClosed: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Survey", surveySchema);
