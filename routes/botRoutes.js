const express = require("express");
const router = express.Router();
const botController = require("../controlers/botController");
const { isLoggedIn } = require("../middleware/user.middleware");

// Bot CRUD operations
router.post("/", isLoggedIn, botController.createBot);
router.get("/", isLoggedIn, botController.getUserBots);
router.get("/:id", isLoggedIn, botController.getBotById);
router.put("/:id", isLoggedIn, botController.updateBot);
router.delete("/:id", isLoggedIn, botController.deleteBot);

// Bot documents operations
router.get("/:botId/documents", isLoggedIn, botController.getBotDocuments);

module.exports = router;
