import dotenv from "dotenv";

import { ChatOpenAI } from "@langchain/openai";
import { ChatCohere } from "@langchain/cohere";

dotenv.config();

let llm;

if (process.env.LLM_PROVIDER === "cohere") {
	llm = new ChatCohere({
		model: "command-r-plus",
		temperature: 0.7,
		apiKey: process.env.COHERE_API_KEY,
	});
} else {
	llm = new ChatOpenAI({
		modelName: process.env.GPT_MODEL || "gpt-3.5-turbo",
		temperature: 0.7,
		openAIApiKey: process.env.OPENAI_API_KEY,
	});
}

export default llm;
