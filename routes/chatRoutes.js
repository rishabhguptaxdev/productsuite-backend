import express from "express";
import {
	getAnswerFromBot,
	getChatHistory,
} from "../controlers/chatController.js";
import { isLoggedIn } from "../middleware/user.middleware.js";

const router = express.Router();

router.post("/:botId", isLoggedIn, getAnswerFromBot);
router.get("/:botId/history", isLoggedIn, getChatHistory);

export default router;
