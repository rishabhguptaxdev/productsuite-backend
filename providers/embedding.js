import { OpenAIEmbeddings } from "@langchain/openai";
import { CohereEmbeddings } from "@langchain/community/embeddings/cohere";
import config from "../config/app.config.js";

let embeddings;

if (config.embeddingProvider === "cohere") {
	embeddings = new CohereEmbeddings({
		model: "embed-english-v3.0",
		apiKey: config.cohere.apiKey,
	});
} else {
	embeddings = new OpenAIEmbeddings({
		modelName: "text-embedding-3-small",
		openAIApiKey: config.openai.apiKey,
	});
}

export default embeddings;
