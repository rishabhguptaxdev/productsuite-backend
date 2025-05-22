import { ChatOpenAI } from "@langchain/openai";
import { ChatCohere } from "@langchain/cohere";
import config from "../config/app.config.js";

let llm;

if (config.llmProvider === "cohere") {
	llm = new ChatCohere({
		model: "command-r-plus",
		temperature: 0.7,
		apiKey: config.cohere.apiKey,
	});
} else {
	llm = new ChatOpenAI({
		modelName: config.openai.model,
		temperature: 0.7,
		openAIApiKey: config.openai.apiKey,
	});
}

export default llm;
