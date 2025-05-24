import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

import Bot from "../models/bot.js";
import Document from "../models/document.js";
import { processDocuments } from "../service/embeddingService.js";
import qdrantConnector from "../connectors/qdrantdb.connector.js";
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
		const { name, description, isShareable } = req.body;
		const userId = req.user.id;

		const bot = await Bot.findOneAndUpdate(
			{ _id: id, owner: userId },
			{ name, description, isShareable, updatedAt: Date.now() },
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

		// 1. Find and delete the bot
		const bot = await Bot.findOneAndDelete({ _id: id, owner: userId });
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		// 2. Get all documents associated with the bot
		const documents = await Document.find({ bot: id });

		// 3. Delete all document files from the filesystem
		const fileDeletionPromises = documents.map(async (doc) => {
			try {
				// Use fs.promises.access to check if file exists
				try {
					await fs.access(doc.path);
					// File exists, so delete it
					await fs.unlink(doc.path);
				} catch (accessError) {
					// File doesn't exist, no problem
					if (accessError.code !== "ENOENT") {
						throw accessError;
					}
				}
			} catch (fileError) {
				console.error("Error deleting document file:", fileError);
			}
		});
		await Promise.all(fileDeletionPromises);

		// 4. Delete all documents from MongoDB
		await Document.deleteMany({ bot: id });

		// 5. Delete vector embeddings from Qdrant
		try {
			const collectionName = `bot_${id}`;
			const client = qdrantConnector.getClient();

			// Check if collection exists
			try {
				await client.getCollection(collectionName);
				// Collection exists, so delete it
				await client.deleteCollection(collectionName);
				console.log(`Deleted Qdrant collection: ${collectionName}`);
			} catch (collectionError) {
				if (collectionError.status !== 404) {
					// Only log if it's not a "not found" error
					console.error(
						"Error checking/deleting Qdrant collection:",
						collectionError
					);
				}
				// Collection doesn't exist - that's fine, we can continue
			}
		} catch (vectorError) {
			console.error("Error deleting vector embeddings:", vectorError);
			// Don't fail the entire operation if vector deletion fails
		}

		res.status(200).json({
			message: "Bot and all associated data deleted successfully",
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

export const getPublicBotById = async (req, res) => {
	try {
		const { id } = req.params;
		const bot = await Bot.findOne({ _id: id });

		if (!bot) {
			return res.status(404).json({
				success: false,
				message: "Bot does not exist",
			});
		}

		if (!bot.isShareable) {
			return res.status(403).json({
				success: false,
				message: "Bot is not shareble",
			});
		}

		res.json({ success: true, bot });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
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
