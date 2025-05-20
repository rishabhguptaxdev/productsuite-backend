import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// Import all routes
import responseRoutes from "./routes/response.js";
import surveyRoutes from "./routes/survey.js";
import userRoutes from "./routes/user.js";
import botRoutes from "./routes/botRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Cookies and middleware
app.use(cookieParser());

// Enable CORS for all routes
app.use(cors());

// Health check route
app.get("/health", (req, res) => {
	res.json({
		status: true,
		message: "Everything is up and running 🎉",
	});
});

// Logger
app.use(morgan("tiny"));

// Routes
app.use("/api/v1/response", responseRoutes);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/survey", surveyRoutes);
app.use("/api/v1/bots", botRoutes);
app.use("/api/v1/chat", chatRoutes);

export default app;
