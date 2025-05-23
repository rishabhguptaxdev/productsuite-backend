import Bot from "../models/bot.js";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import llm from "../providers/llm.js";
import embeddings from "../providers/embedding.js";
import qdrantConnector from "../connectors/qdrantdb.connector.js";

export const getAnswer = async (botId, question) => {
	const bot = await Bot.findById(botId);
	if (bot.status !== "ready") throw new Error("Bot not ready");

	const vectorStore = await QdrantVectorStore.fromExistingCollection(
		embeddings,
		{
			client: qdrantConnector.getClient(),
			collectionName: `bot_${botId}`,
		}
	);

	const retriever = vectorStore.asRetriever();
	const docs = await retriever.getRelevantDocuments(question);

	// If no relevant docs, return fallback response
	if (!docs || docs.length === 0) {
		return "I'm sorry, I couldn’t find any relevant information to answer that.";
	}

	const context = docs.map((doc) => doc.pageContent).join("\n---\n");

	const prompt = `You are a helpful assistant. Answer the question strictly based on the context below. 
					If the context does not contain enough information, respond with some good response not knowing.
					Context:
					${context}
					Question: ${question}
					Answer:`;

	const response = await llm.call([{ role: "user", content: prompt }]);
	return response.content;
};
