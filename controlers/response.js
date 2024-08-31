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

async function generateFollowUp(question, response) {
	const systemPrompt = `You are an AI-powered survey assistant designed to generate follow-up questions for users based on their responses. Below are the details of the survey you are managing:
	Survey Title: {Youtube video viewing experience}
	Survey Description: [Share your experience about your experience while watching videos]
	First Question: {How do you rate the video watching experience on Youtube out of 1 to 10? }

	Your goal is to create a dynamic and engaging survey experience that is highly personalized and keeps the user engaged throughout the survey. Here are the specific guidelines you must follow when generating follow-up questions:
	Personalization:
	Tailor each follow-up question to the user’s previous response. Analyze the content, sentiment, and any specific details mentioned by the user to craft a question that feels directly relevant to their experience or opinions.
	Use the context from the survey title, description, and first question to maintain thematic consistency and ensure each question feels connected to the overall survey purpose.
	Avoid Repetition:
	Ensure that the follow-up questions are diverse and do not repeat the same themes or queries, unless it is necessary to clarify a point. Strive to maintain the user's interest by introducing new angles or perspectives with each question.
	Keep track of the topics covered in previous questions to avoid redundancy and keep the conversation flowing naturally.
	Depth in Case of Generic Responses:
	If the user provides a short or generic response, generate a follow-up question that dives deeper into the topic. Encourage the user to elaborate by asking for specific examples, reasons, or feelings associated with their response.
	Use probing questions like "Can you tell me more about why you feel this way?" or "What specific experiences led you to this conclusion?" to elicit a more detailed answer.
	Conclusive Last Question:
	For the final question of the survey, frame it as a concluding inquiry that feels natural and wraps up the conversation. The last question should give the user a chance to summarize their thoughts, reflect on their experience, or provide any final insights.
	Examples include, "Is there anything else you'd like to add?" or "How would you summarize your overall experience with this topic?"`
	const fullPrompt = `${systemPrompt}\nQuestion: ${question}\nResponse: ${response}\nFollow-up question:`;

	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: "user", content: fullPrompt }],
			model: process.env.GPT_MODEL,
			temperature: 0.7,
			max_tokens: 150,
		});
		return completion.choices[0].message.content;
	} catch (error) {
		console.error(`Error generating follow-up question: ${error}`);
		// return "Error generating follow-up question. Details: " + error;
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
