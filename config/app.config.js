import dotenv from "dotenv";
import local from "./env/local.js";
import production from "./env/production.js";

dotenv.config();

const currentEnv = process.env.NODE_ENV || "local";
console.log(`[·] Using ${currentEnv} environment`);
const envMap = {
	local,
	production,
};

const selectedConfig = envMap[currentEnv] || local;

const config = {
	env: currentEnv,

	port: process.env.PORT || 5050,

	// MongoDB
	mongoUrl: selectedConfig.mongoUrl,

	// JWT
	jwt: {
		secret: process.env.JWT_SECRET,
		expiry: process.env.JWT_EXPIRY || "2d",
		cookieExpiry: parseInt(process.env.COOKIE_EXPIRY) || 5,
	},

	// LLM and Embeddings
	llmProvider: process.env.LLM_PROVIDER || "cohere",
	embeddingProvider: process.env.EMBEDDING_PROVIDER || "cohere",

	openai: {
		apiKey: process.env.OPENAI_API_KEY,
		model: process.env.GPT_MODEL || "gpt-3.5-turbo",
		embeddingModel: "text-embedding-3-small",
	},

	cohere: {
		apiKey: process.env.COHERE_API_KEY,
		model: "command-r-plus",
		embeddingModel: "embed-english-v3.0",
	},

	// Qdrant
	qdrant: {
		url: selectedConfig.qdrantUrl,
		apiKey: selectedConfig.qdrantApiKey,
	},
};

export default config;
