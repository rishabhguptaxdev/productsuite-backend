import dotenv from "dotenv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { CohereEmbeddings } from "@langchain/community/embeddings/cohere";

dotenv.config();

let embeddings;

if (process.env.EMBEDDING_PROVIDER === "cohere") {
	embeddings = new CohereEmbeddings({
		model: "embed-english-v3.0",
		apiKey: process.env.COHERE_API_KEY,
	});
} else {
	embeddings = new OpenAIEmbeddings({
		modelName: "text-embedding-3-small",
		openAIApiKey: process.env.OPENAI_API_KEY,
	});
}

export default embeddings;
