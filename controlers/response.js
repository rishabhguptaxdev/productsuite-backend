import mongoose from "mongoose";
import dotenv from "dotenv";
import SurveyResponse from "../models/response.js";
import Survey from "../models/survey.js";
import llm from "../providers/llm.js";

dotenv.config();

// Helper: Generate follow-up question using LLM
async function generateFollowUp(questionHistory, description) {
	const formatted = questionHistory
		.map((qa) => `System - ${qa.question}\nUser - ${qa.response}`)
		.join("\n");

	const prompt = `Generate the next follow-up question for the survey which is about ${description} where so far this conversation happens between user and the system is:\n${formatted}\nThe follow-up questions generate by system should be engaging, non-repetitive, and concise\nIMPORTANT: Provide ONLY the question text. Do NOT include "System -" or any other labels in your response.`;

	const response = await llm.call([{ role: "user", content: prompt }]);
	return response.content;
}

export const getSurveyResponseById = async (req, res) => {
	try {
		const survey = await SurveyResponse.findOne({
			_id: req.params.id,
		}).populate({
			path: "surveyId",
			select: "max_questions title description",
		});
		if (!survey) {
			return res.status(404).json({ message: "Survey not found" });
		}
		return res.json(survey);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

export const getAllSurveyResponses = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = (page - 1) * limit;
		const sortField = req.query.sort || "updatedAt";
		const sortOrder = sortField === "oldest" ? 1 : -1;

		const aggregation = [
			{
				$match: { surveyId: new mongoose.Types.ObjectId(req.params.id) },
			},
			{
				$facet: {
					metadata: [{ $count: "total" }, { $addFields: { page, limit } }],
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

export const updateSurveyResponse = async (req, res) => {
	try {
		const surveyResponse = await SurveyResponse.findOne({
			_id: req.params.id,
		}).populate({ path: "surveyId" });

		if (!surveyResponse) {
			return res.status(404).json({ message: "Survey not found" });
		}

		if (surveyResponse.questions.length === 0) {
			const survey = await Survey.findOne({ _id: surveyResponse.surveyId });
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
			select: "max_questions title description",
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

export const getLoggerId = async (req, res) => {
	try {
		const { surveyId } = req.params;
		const survey = await Survey.findOne({ _id: surveyId });

		if (!survey) {
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

export const surveyExperience = async (req, res) => {
	try {
		const { surveyResponseId, rating, comments } = req.body;

		const surveyResponse = await SurveyResponse.findOne({
			_id: surveyResponseId,
		});

		if (!surveyResponse) {
			return res.status(404).json({ message: "Survey not found" });
		}

		surveyResponse.surveyExperience = { rating, comments };

		const savedSurveyResponse = await surveyResponse.save();

		res.status(200).json({ savedSurveyResponse });
	} catch (err) {
		console.error("Something went wrong while saving survey experience", err);
		res.status(500).json({ message: err.message });
	}
};
