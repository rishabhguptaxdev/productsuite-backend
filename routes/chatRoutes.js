const express = require("express");
const router = express.Router();
const chatController = require("../controlers/chatController");
const { isLoggedIn } = require("../middleware/user.middleware");

router.post("/:botId", isLoggedIn, chatController.getAnswer);
router.get("/:botId/history", isLoggedIn, chatController.getChatHistory);

module.exports = router;
