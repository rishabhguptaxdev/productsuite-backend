const Bot = require("../models/bot");
const DocumentModel = require("../models/document");
const {
	QdrantVectorStore,
} = require("@langchain/community/vectorstores/qdrant");
const { OllamaEmbeddings } = require("@langchain/ollama");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

exports.processDocuments = async (botId, filePaths) => {
	try {
		const embeddings = new OllamaEmbeddings({
			model: "nomic-embed-text", // Ensure this model is pulled in Ollama
			baseUrl: "http://localhost:11434", // Ollama's default base URL
		});

		for (const filePath of filePaths) {
			const loader = new PDFLoader(filePath);
			const rawDocs = await loader.load();

			const textSplitter = new RecursiveCharacterTextSplitter({
				chunkSize: 800,
				chunkOverlap: 100,
			});

			const docs = await textSplitter.splitDocuments(rawDocs);

			const vectorStore = await QdrantVectorStore.fromExistingCollection(
				embeddings,
				{
					collectionName: `bot_${botId}`,
					url: "http://localhost:6333",
				}
			);

			await vectorStore.addDocuments(docs);

			await DocumentModel.updateOne(
				{ path: filePath },
				{ status: "processed", processedAt: new Date() },
				{ upsert: true }
			);
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
