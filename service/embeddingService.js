import fs from "fs/promises";
import DocumentModel from "../models/document.js";
import Bot from "../models/bot.js";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import embeddings from "../providers/embedding.js";

export const processDocuments = async (botId, filePaths) => {
	try {
		for (const filePath of filePaths) {
			const loader = new PDFLoader(filePath);
			const rawDocs = await loader.load();

			const textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 800,
				chunkOverlap: 100,
			});

			const docs = await textSplitter.splitDocuments(rawDocs);
			const texts = docs.map((doc) => doc.pageContent);
			const vectors = await embeddings.embedDocuments(texts);

			const vectorStore = await QdrantVectorStore.fromExistingCollection(
				embeddings,
				{
					collectionName: `bot_${botId}`,
					url: process.env.QDRANT_DB_URL,
				}
			);

			await vectorStore.addDocuments(docs);

			await DocumentModel.updateOne(
				{ path: filePath },
				{ status: "processed", processedAt: new Date() },
				{ upsert: true }
			);

			await fs.unlink(filePath);
			console.log(`Deleted processed file: ${filePath}`);
		}

		await Bot.findByIdAndUpdate(botId, { status: "ready" });
	} catch (error) {
		console.error("Document processing error:", error);
		await Bot.findByIdAndUpdate(botId, {
			status: "failed",
			error: error.message,
		});
	}
};
