export default {
	mongoUrl: process.env.MONGO_DB_URL || "mongodb://localhost:27017/survey",
	qdrantUrl: "http://localhost:6333",
	qdrantApiKey: null,
};
