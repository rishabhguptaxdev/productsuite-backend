import Bot from "../models/bot.js";

export const allowIfShareable = async (req, res, next) => {
	const { botId } = req.params;

	const bot = await Bot.findById(botId);
	if (!bot) return res.status(404).json({ message: "Bot not found" });

	if (bot.isShareable || req.user) {
		req.bot = bot;
		return next();
	}

	return res.status(403).json({ message: "Unauthorized" });
};
