const User = require("../models/User");
const SurveyResponse = require("../models/response");
const Survey = require("../models/survey");
const sendToken = require("../utils/sendToken");
const OpenAI = require("openai");
const mongoose = require("mongoose");
require("dotenv").config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function generateFollowUp(question, response) {
	const systemPrompt =
		"As an AI-powered user interview, your job is to ask questions based on user responses, " +
		"and try to understand and gather in-depth feedback from the user. Your questions should " +
		"be direct and designed to elicit detailed and informative responses.";
	const fullPrompt = `${systemPrompt}\nQuestion: ${question}\nResponse: ${response}\nFollow-up question:`;

	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: "user", content: fullPrompt }],
			model: "gpt-3.5-turbo",
			temperature: 0.7,
			max_tokens: 150,
		});
		return completion.choices[0].message.content;
	} catch (error) {
		console.error(`Error generating follow-up question: ${error}`);
		return "Error generating follow-up question. Details: " + error;
	}
}

exports.getSurveyResponseById = async (req, res) => {
	try {
		const survey = await SurveyResponse.findOne({ _id: req.params.id });
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
		const responses = await SurveyResponse.find({
			surveyId: new mongoose.Types.ObjectId(req.params.id),
		});
		return res.json(responses);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

exports.updateSurveyResponse = async (req, res) => {
	try {
		const surveyResponse = await SurveyResponse.findOne({
			_id: req.params.id,
		});
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
			const lastQuestion =
				surveyResponse.questions[surveyResponse.questions.length - 1].question;
			const followUpQuestion = await generateFollowUp(
				lastQuestion,
				responses[responses.length - 1]
			);
			surveyResponse.questions.push({
				question: followUpQuestion,
				response: "",
			});
		} else {
			surveyResponse.isCompleted = true;
		}

		const updatedSurvey = await surveyResponse.save();
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
