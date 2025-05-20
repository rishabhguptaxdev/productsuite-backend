import Bot from "../models/bot.js";
import { getAnswer } from "../service/ragService.js";

// Get answer from bot using RAG
export const getAnswerFromBot = async (req, res) => {
	try {
		const { botId } = req.params;
		const { question } = req.body;
		const userId = req.user.id;

		// Verify the user owns the bot
		const bot = await Bot.findOne({ _id: botId, owner: userId });
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		// Check if bot is ready
		if (bot.status !== "ready") {
			return res.status(400).json({
				message: "Bot is not ready yet",
				status: bot.status,
			});
		}

		// Get answer using RAG
		const answer = await getAnswer(botId, question);

		res.status(200).json({
			botId,
			question,
			answer,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error("Chat error:", error);

		let statusCode = 500;
		let message = "Failed to get answer from bot";

		if (error.message.includes("Bot is not ready")) {
			statusCode = 400;
			message = error.message;
		}

		res.status(statusCode).json({
			message,
			error: error.message,
		});
	}
};

// Optional: Get chat history for a bot
export const getChatHistory = async (req, res) => {
	try {
		const { botId } = req.params;
		const userId = req.user.id;

		// Verify the user owns the bot
		const bot = await Bot.findOne({ _id: botId, owner: userId });
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		// Placeholder: static history
		const history = [
			{
				question: "What is this bot about?",
				answer: "This bot helps with document queries.",
				timestamp: new Date(Date.now() - 3600000),
			},
			{
				question: "How do I use it?",
				answer: "Just ask questions about your documents.",
				timestamp: new Date(Date.now() - 1800000),
			},
		];

		res.status(200).json({
			botId,
			history,
			count: history.length,
		});
	} catch (error) {
		console.error("Chat history error:", error);
		res.status(500).json({
			message: "Failed to get chat history",
			error: error.message,
		});
	}
};
