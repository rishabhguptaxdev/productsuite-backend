import express from "express";
import {
	createBot,
	getUserBots,
	getBotById,
	updateBot,
	deleteBot,
	getBotDocuments,
	getPublicBotById,
} from "../controlers/botController.js";
import { isLoggedIn } from "../middleware/user.middleware.js";

const router = express.Router();

// Bot CRUD operations
router.post("/", isLoggedIn, createBot);
router.get("/", isLoggedIn, getUserBots);
router.get("/:id", isLoggedIn, getBotById);
router.put("/:id", isLoggedIn, updateBot);
router.delete("/:id", isLoggedIn, deleteBot);
router.get("/public/:id", getPublicBotById);

// Bot documents operations
router.get("/:botId/documents", isLoggedIn, getBotDocuments);

export default router;
