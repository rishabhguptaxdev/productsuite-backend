import mongoose from "mongoose";

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
			required: [true, "User is not logged in"],
		},
		isClosed: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

const Survey = mongoose.model("Survey", surveySchema);
export default Survey;
