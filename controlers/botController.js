const Bot = require("../models/bot");
const Document = require("../models/document");
const { processDocuments } = require("../service/embeddingService");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

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

// Modified createBot controller
exports.createBot = async (req, res) => {
	// Handle the upload first
	upload(req, res, async (err) => {
		if (err) {
			if (err instanceof multer.MulterError) {
				return res.status(400).json({ message: err.message });
			}
			return res.status(400).json({ message: err.message });
		}

		try {
			// Now access fields from req.body
			const { name, description } = req.body;

			if (!name || !description) {
				return res
					.status(400)
					.json({ message: "Name and description are required" });
			}

			if (!req.files || req.files.length === 0) {
				return res
					.status(400)
					.json({ message: "At least one PDF file is required" });
			}

			// Rest of your bot creation logic...
			const bot = new Bot({
				name,
				description,
				owner: req.user.id,
				status: "processing",
			});

			await bot.save();

			// Process documents...
			const documents = req.files.map((file) => ({
				filename: file.originalname,
				path: file.path,
				bot: bot._id,
			}));

			const savedDocs = await Document.insertMany(documents);

			// Process documents async
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

// Get all bots for the authenticated user
exports.getUserBots = async (req, res) => {
	try {
		const userId = req.user.id;
		const bots = await Bot.find({ owner: userId })
			.sort({ createdAt: -1 })
			.select("-__v");

		res.status(200).json({ bots });
	} catch (error) {
		console.error("Get user bots error:", error);
		res
			.status(500)
			.json({ message: "Failed to fetch bots", error: error.message });
	}
};

// Get a specific bot by ID
exports.getBotById = async (req, res) => {
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
		res
			.status(500)
			.json({ message: "Failed to fetch bot", error: error.message });
	}
};

// Update bot information
exports.updateBot = async (req, res) => {
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
		res
			.status(500)
			.json({ message: "Failed to update bot", error: error.message });
	}
};

// Delete a bot and its associated documents
exports.deleteBot = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user.id;

		// Find and delete the bot
		const bot = await Bot.findOneAndDelete({ _id: id, owner: userId });
		if (!bot) {
			return res.status(404).json({ message: "Bot not found" });
		}

		// Get associated documents
		const documents = await Document.find({ bot: id });

		// Delete document files from filesystem
		documents.forEach((doc) => {
			try {
				if (fs.existsSync(doc.path)) {
					fs.unlinkSync(doc.path);
				}
			} catch (fileError) {
				console.error("Error deleting document file:", fileError);
			}
		});

		// Delete documents from database
		await Document.deleteMany({ bot: id });

		// TODO: Delete vector embeddings from vector database

		res.status(200).json({
			message: "Bot and associated documents deleted successfully",
			deletedBotId: id,
		});
	} catch (error) {
		console.error("Delete bot error:", error);
		res
			.status(500)
			.json({ message: "Failed to delete bot", error: error.message });
	}
};

// Get bot's documents
exports.getBotDocuments = async (req, res) => {
	try {
		const { botId } = req.params;
		const userId = req.user.id;

		// Verify bot ownership
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
		res
			.status(500)
			.json({ message: "Failed to fetch documents", error: error.message });
	}
};
