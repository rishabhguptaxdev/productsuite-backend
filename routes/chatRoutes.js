import express from "express";
import {
	getAnswerFromBot,
	getChatHistory,
} from "../controlers/chatController.js";
import { isLoggedIn, optionalAuth } from "../middleware/user.middleware.js";

const router = express.Router();

router.post("/:botId", optionalAuth, getAnswerFromBot);
router.get("/:botId/history", isLoggedIn, getChatHistory);

export default router;
