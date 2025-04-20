const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

//Import all routes
const response = require("./routes/response");
const survey = require("./routes/survey");
const user = require("./routes/user");
const botRoutes = require("./routes/botRoutes");
const chatRoutes = require("./routes/chatRoutes");

require("dotenv").config();

const app = express();

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// cookies and middlewares
app.use(cookieParser());

// Enable CORS for all routes
app.use(cors());

app.get("/health", (req, res) => {
	res.json({
		status: true,
		message: "Everything is up and running 🎉",
	});
});

app.use(morgan("tiny"));
app.use("/api/v1/response", response);
app.use("/api/v1/auth", user);
app.use("/api/v1/survey", survey);
app.use("/api/v1/bots", botRoutes);
app.use("/api/v1/chat", chatRoutes);

module.exports = app;
