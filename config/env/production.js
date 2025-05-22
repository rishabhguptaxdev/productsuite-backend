import dotenv from "dotenv";
dotenv.config();

export default {
	mongoUrl: process.env.MONGO_DB_URL,
	qdrantUrl: process.env.QDRANT_DB_URL,
	qdrantApiKey: process.env.QDRANT_API_KEY,
};
