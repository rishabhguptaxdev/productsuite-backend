import Bot from "../models/bot.js";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import llm from "../providers/llm.js";
import embeddings from "../providers/embedding.js";

export const getAnswer = async (botId, question) => {
	const bot = await Bot.findById(botId);
	if (bot.status !== "ready") throw new Error("Bot not ready");

	const vectorStore = await QdrantVectorStore.fromExistingCollection(
		embeddings,
		{
			collectionName: `bot_${botId}`,
			url: "http://localhost:6333",
		}
	);

	const retriever = vectorStore.asRetriever();
	const docs = await retriever.getRelevantDocuments(question);
	const context = docs.map((doc) => doc.pageContent).join("\n---\n");

	const prompt = `Answer the following question based on the context below.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

	const response = await llm.call([{ role: "user", content: prompt }]);
	return response.content;
};
