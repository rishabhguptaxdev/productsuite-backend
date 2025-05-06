const { RetrievalQAChain } = require("langchain/chains");
const { Ollama } = require("@langchain/community/llms/ollama"); // For local LLM
const Bot = require("../models/bot");
const { OllamaEmbeddings } = require("@langchain/ollama");
const {
	QdrantVectorStore,
} = require("@langchain/community/vectorstores/qdrant");

exports.getAnswer = async (botId, question) => {
	try {
		// Check bot status
		const bot = await Bot.findById(botId);
		if (bot.status !== "ready") {
			throw new Error("Bot is not ready yet");
		}

		// Initialize ollama embeddings
		const embeddings = new OllamaEmbeddings({
			model: "nomic-embed-text", // Ensure this model is pulled in Ollama
			baseUrl: "http://localhost:11434", // Ollama's default base URL
		});

		// Connect to Qdrant
		const vectorStore = await QdrantVectorStore.fromExistingCollection(
			embeddings,
			{
				collectionName: `bot_${botId}`,
				url: "http://localhost:6333",
			}
		);

		// Initialize LOCAL LLM via Ollama (recommended alternative)
		const model = new Ollama({
			baseUrl: "http://localhost:11434",
			model: "gemma3:1b",
			temperature: 0.7,
		});

		const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
		const response = await chain.call({ query: question });
		return response.text;
	} catch (error) {
		console.error("RAG error:", error);
		throw error;
	}
};
