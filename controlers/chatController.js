import Bot from "../models/bot.js";
import { getAnswer } from "../service/ragService.js";

// Get answer from bot using RAG
export const getAnswerFromBot = async (req, res) => {
	try {
		const { botId } = req.params;
		const { question } = req.body;
		const userId = req.user?.id;

		// Load the bot
		const bot = await Bot.findById(botId);
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		// If user is not authenticated, ensure the bot is shareable
		if (!userId && !bot.isShareable) {
			return res
				.status(403)
				.json({ message: "Unauthorized or bot is private" });
		}

		// If user is authenticated, ensure they own the bot
		if (userId && bot.owner.toString() !== userId) {
			return res.status(403).json({ message: "You don't own this bot" });
		}

		// Ensure the bot is ready
		if (bot.status !== "ready") {
			return res.status(400).json({
				message: "Bot is not ready yet",
				status: bot.status,
			});
		}

		const answer = await getAnswer(botId, question);

		res.status(200).json({
			botId,
			question,
			answer,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error("Chat error:", error);

		res.status(500).json({
			message: "Failed to get answer from bot",
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
