import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

import Bot from "../models/bot.js";
import Document from "../models/document.js";
import { processDocuments } from "../service/embeddingService.js";

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
	destination: async (req, file, cb) => {
		const uploadDir = path.join(__dirname, "..", "uploads");
		await fs.promises.mkdir(uploadDir, { recursive: true });
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueName = `${Date.now()}-${file.originalname}`;
		cb(null, uniqueName);
	},
});

// File filter for PDFs only
const fileFilter = (req, file, cb) => {
	if (file.mimetype === "application/pdf") {
		cb(null, true);
	} else {
		cb(new Error("Only PDF files are allowed!"), false);
	}
};

// Initialize multer
const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).array("documents", 5); // Max 5 files

// 🧠 Exported controller functions

export const createBot = async (req, res) => {
	upload(req, res, async (err) => {
		if (err) {
			if (err instanceof multer.MulterError) {
				return res.status(400).json({ message: err.message });
			}
			return res.status(400).json({ message: err.message });
		}

		try {
			const { name, description } = req.body;

			if (!name || !description) {
				return res.status(400).json({
					message: "Name and description are required",
				});
			}

			if (!req.files || req.files.length === 0) {
				return res.status(400).json({
					message: "At least one PDF file is required",
				});
			}

			const bot = new Bot({
				name,
				description,
				owner: req.user.id,
				status: "processing",
			});

			await bot.save();

			const documents = req.files.map((file) => ({
				filename: file.originalname,
				path: file.path,
				bot: bot._id,
			}));

			const savedDocs = await Document.insertMany(documents);

			processDocuments(
				bot._id,
				savedDocs.map((doc) => doc.path)
			);

			res.status(201).json({
				message: "Bot created successfully",
				bot,
				documents: savedDocs,
			});
		} catch (error) {
			console.error("Bot creation error:", error);
			res.status(500).json({ message: "Server error during bot creation" });
		}
	});
};

export const getUserBots = async (req, res) => {
	try {
		const userId = req.user.id;
		const bots = await Bot.find({ owner: userId })
			.sort({ createdAt: -1 })
			.select("-__v");

		res.status(200).json({ bots });
	} catch (error) {
		console.error("Get user bots error:", error);
		res.status(500).json({
			message: "Failed to fetch bots",
			error: error.message,
		});
	}
};

export const getBotById = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const bot = await Bot.findOne({ _id: id, owner: userId }).populate({
			path: "documents",
			select: "filename status processedAt",
		});

		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		res.status(200).json(bot);
	} catch (error) {
		console.error("Get bot by ID error:", error);
		res.status(500).json({
			message: "Failed to fetch bot",
			error: error.message,
		});
	}
};

export const updateBot = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description } = req.body;
		const userId = req.user.id;

		const bot = await Bot.findOneAndUpdate(
			{ _id: id, owner: userId },
			{ name, description, updatedAt: Date.now() },
			{ new: true, runValidators: true }
		);

		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		res.status(200).json({
			message: "Bot updated successfully",
			bot,
		});
	} catch (error) {
		console.error("Update bot error:", error);
		res.status(500).json({
			message: "Failed to update bot",
			error: error.message,
		});
	}
};

export const deleteBot = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		const bot = await Bot.findOneAndDelete({ _id: id, owner: userId });
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		const documents = await Document.find({ bot: id });

		documents.forEach((doc) => {
			try {
				if (fs.existsSync(doc.path)) {
					fs.unlinkSync(doc.path);
				}
			} catch (fileError) {
				console.error("Error deleting document file:", fileError);
			}
		});

		await Document.deleteMany({ bot: id });

		// TODO: Delete vector embeddings from vector database

		res.status(200).json({
			message: "Bot and associated documents deleted successfully",
			deletedBotId: id,
		});
	} catch (error) {
		console.error("Delete bot error:", error);
		res.status(500).json({
			message: "Failed to delete bot",
			error: error.message,
		});
	}
};

export const getBotDocuments = async (req, res) => {
	try {
		const { botId } = req.params;
		const userId = req.user.id;

		const botExists = await Bot.exists({ _id: botId, owner: userId });
		if (!botExists) {
			return res.status(404).json({ message: "Bot not found" });
		}

		const documents = await Document.find({ bot: botId })
			.select("-__v -bot")
			.sort({ uploadedAt: -1 });

		res.status(200).json(documents);
	} catch (error) {
		console.error("Get bot documents error:", error);
		res.status(500).json({
			message: "Failed to fetch documents",
			error: error.message,
		});
	}
};
