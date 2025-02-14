const User = require("../models/user");
const SurveyResponse = require("../models/response");
const Survey = require("../models/survey");
const sendToken = require("../utils/sendToken");
const OpenAI = require("openai");
const mongoose = require("mongoose");
require("dotenv").config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function generateFollowUp(questionHistory, description) {
	const formattedQuestionHistory = questionHistory
		.map((qa, index) => `System - ${qa.question}\nUser - ${qa.response}`)
		.join("\n");

	const systemPrompt = `Generate the next follow-up question for the survey which is about ${description} where so far this conversation happens between user and the system is:\n${formattedQuestionHistory}\nThe follow-up questions generate by system should be engaging, non-repetitive, and concise\nIMPORTANT: Provide ONLY the question text. Do NOT include "System -" or any other labels in your response.`;
	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: "user", content: systemPrompt }],
			model: process.env.GPT_MODEL,
			temperature: 0.7,
			max_tokens: 150,
		});
		return completion.choices[0].message.content;
	} catch (error) {
		console.error(`Error generating follow-up question: ${error}`);
		throw error;
	}
}

exports.getSurveyResponseById = async (req, res) => {
	try {
		const survey = await SurveyResponse.findOne({
			_id: req.params.id,
		}).populate({
			path: "surveyId",
			select: "max_questions title description",
		});
		if (survey == null) {
			return res.status(404).json({ message: "Survey not found" });
		}
		return res.json(survey);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

exports.getAllSurveyResponses = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = (page - 1) * limit;
		const sortField = req.query.sort || "updatedAt";

		let sortOrder = sortField === "oldest" ? 1 : -1;

		const aggregation = [
			{
				$match: { surveyId: new mongoose.Types.ObjectId(req.params.id) },
			},
			{
				$facet: {
					metadata: [
						{ $count: "total" },
						{ $addFields: { page: page, limit: limit } },
					],
					data: [
						{ $sort: { [sortField]: sortOrder } },
						{ $skip: skip },
						{ $limit: limit },
					],
				},
			},
		];

		const result = await SurveyResponse.aggregate(aggregation);
		const responses = result[0].data;
		const total = result[0].metadata[0]?.total || 0;

		res.json({
			responses,
			total,
			page,
			totalPages: Math.ceil(total / limit),
			limit,
		});
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

exports.updateSurveyResponse = async (req, res) => {
	try {
		const surveyResponse = await SurveyResponse.findOne({
			_id: req.params.id,
		}).populate({ path: "surveyId" });
		if (surveyResponse == null) {
			return res.status(404).json({ message: "Survey not found" });
		}

		if (surveyResponse.questions.length === 0) {
			const survey = await Survey.findOne({
				_id: surveyResponse.surveyId,
			});
			surveyResponse.questions.push(survey.questions[0]);
			surveyResponse.max_questions = survey.max_questions;
		}

		const { responses } = req.body;
		surveyResponse.questions.forEach((q, i) => {
			if (responses[i]) {
				surveyResponse.questions[i].response = responses[i];
			}
		});

		if (surveyResponse.questions.length < surveyResponse.max_questions) {
			const questionHistory = surveyResponse.questions.map((q) => ({
				question: q.question,
				response: q.response,
			}));

			const followUpQuestion = await generateFollowUp(
				questionHistory,
				surveyResponse.surveyId?.description
			);
			surveyResponse.questions.push({
				question: followUpQuestion,
				response: "",
			});
		} else {
			surveyResponse.isCompleted = true;
		}

		const updatedSurvey = await surveyResponse.save();
		await updatedSurvey.populate({
			path: "surveyId",
			select: "max_questions title description", // Fields to populate
		});
		return res.json({
			updatedSurvey,
			isSurveyCompleted: surveyResponse.isCompleted,
			isLastResponse:
				surveyResponse.questions.length === surveyResponse.max_questions,
		});
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

// Creates a new document in response collection
exports.getLoggerId = async (req, res) => {
	try {
		const { surveyId } = req.params;
		const survey = await Survey.findOne({ _id: surveyId });
		if (survey.length === 0) {
			return res.status(404).json({ message: "Survey not found" });
		}
		const newResponse = new SurveyResponse({
			surveyId: survey._id,
			questions: survey.questions,
			max_questions: survey.max_questions,
		});

		await newResponse.save();

		return res.json({ loggerId: newResponse._id });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

exports.surveyExperience = async (req, res) => {
	const { surveyResponseId, rating, comments } = req.body;

	const surveyResponse = await SurveyResponse.findOne({
		_id: surveyResponseId,
	});
	if (surveyResponse == null) {
		return res.status(404).json({ message: "Survey not found" });
	}
	try {
		const { surveyExperience } = req.body;
		surveyResponse.surveyExperience = {
			rating,
			comments,
		};
		const savedSurveyResponse = await surveyResponse.save();

		res.status(200).json({
			savedSurveyResponse,
		});
	} catch (err) {
		console.log(
			"Somethig went wrong while saving survey experience",
			err.message
		);
		res.status(500).json({
			message: err.message,
		});
	}
};
