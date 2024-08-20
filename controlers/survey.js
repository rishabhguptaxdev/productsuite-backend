const User = require("../models/user");
const SurveyResponse = require("../models/response");
const Survey = require("../models/survey");
const sendToken = require("../utils/sendToken");

// Create Survey
exports.createSurvey = async (req, res) => {
	const { title, description, first_question, max_questions } = req.body;
	const survey = new Survey({
		title,
		description,
		questions: [{ question: first_question, response: "" }],
		max_questions,
		user: req.user._id,
	});

	try {
		const savedSurvey = await survey.save();
		return res.json({ savedSurvey });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
};

// Get all Surveys
exports.getAllSurveys = async (req, res) => {
	try {
		const surveys = await Survey.aggregate([
			{
				$match: { user: req.user._id },
			},
			{
				$lookup: {
					from: "responses", // The name of the responses collection
					localField: "_id",
					foreignField: "surveyId",
					as: "responses",
				},
			},
			{
				$addFields: {
					responseCount: { $size: "$responses" },
				},
			},
			{
				$project: {
					responses: 0, // Exclude the responses array if you don't need it
				},
			},
		]);

		return res.json({ surveys });
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
};

// Get Survey by ID
exports.getSurveyById = async (req, res) => {
	try {
		const survey = await Survey.findOne({ _id: req.params.id });
		if (survey == null) {
			return res.status(404).json({ message: "Survey not found" });
		}
		return res.json(survey);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

exports.changeStatusOfSurvey = async (req, res) => {
	try {
		const survey = await Survey.findOneAndUpdate(
			{ _id: req.params.id },
			{ isClosed: req.body?.isClosed }
		);
		if (survey == null) {
			return res.status(404).json({ message: "Survey not found" });
		}

		return res.json(survey);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};
