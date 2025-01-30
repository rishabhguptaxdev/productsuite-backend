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
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = (page - 1) * limit;
		const sortField = req.query.sort || "_id";

		// Define sort order based on field
		const sortOrder = sortField === "title" ? 1 : -1;

		const aggregation = [
			{ $match: { user: req.user._id } },
			{
				$lookup: {
					from: "responses",
					localField: "_id",
					foreignField: "surveyId",
					as: "responses",
				},
			},
			{ $addFields: { responseCount: { $size: "$responses" } } },
			{ $project: { responses: 0 } },
			{ $sort: { [sortField]: sortOrder } }, // Dynamic sorting
			{
				$facet: {
					metadata: [
						{ $count: "total" },
						{ $addFields: { page: page, limit: limit } },
					],
					data: [{ $skip: skip }, { $limit: limit }],
				},
			},
		];

		const result = await Survey.aggregate(aggregation);
		const surveys = result[0].data;
		const total = result[0].metadata[0]?.total || 0;

		res.json({
			surveys,
			total,
			page,
			totalPages: Math.ceil(total / limit),
			limit,
		});
	} catch (err) {
		res.status(400).json({ message: err.message });
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
