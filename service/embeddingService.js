import fs from "fs/promises";
import DocumentModel from "../models/document.js";
import Bot from "../models/bot.js";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import embeddings from "../providers/embedding.js";
import qdrantConnector from "../connectors/qdrantdb.connector.js";

const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export const processDocuments = async (botId, filePaths) => {
	try {
		// Check total size of all files first
		let totalSize = 0;
		for (const filePath of filePaths) {
			const stats = await fs.stat(filePath);
			totalSize += stats.size;
		}

		if (totalSize > MAX_TOTAL_SIZE) {
			throw new Error(
				`Combined size of PDFs (${(totalSize / (1024 * 1024)).toFixed(
					2
				)} MB) exceeds 50 MB limit`
			);
		}

		for (const filePath of filePaths) {
			// Check individual file size
			const stats = await fs.stat(filePath);
			if (stats.size > 50 * 1024 * 1024) {
				throw new Error(`File ${filePath} exceeds 50MB limit`);
			}

			const loader = new PDFLoader(filePath);
			const rawDocs = await loader.load();

			// Check page count
			if (rawDocs.length > 50) {
				throw new Error(
					`PDF has ${rawDocs.length} pages, exceeding 50-page limit`
				);
			}

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
					client: qdrantConnector.getClient(),
					collectionName: `bot_${botId}`,
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

		// Clean up any remaining files
		for (const filePath of filePaths) {
			try {
				await fs.unlink(filePath);
				console.log(`Deleted file after error: ${filePath}`);
			} catch (cleanupError) {
				console.error("Error cleaning up file:", cleanupError);
			}
		}
	}
};
