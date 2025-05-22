import { QdrantClient } from "@qdrant/js-client-rest";
import config from "../config/app.config.js";

class QdrantConnector {
	constructor() {
		this.client = new QdrantClient({
			url: config.qdrant.url,
			apiKey: config.qdrant.apiKey || undefined,
		});
		this.connected = false;
	}

	async connect() {
		try {
			await this.client.getCollections();
			this.connected = true;
			console.log("[✓] QdrantDB connected.");
		} catch (err) {
			this.connected = false;
			console.error("[x] QdrantDB connection failed:", err.message);
			throw err;
		}
	}

	getClient() {
		return this.client;
	}

	isConnected() {
		return this.connected;
	}
}

export default new QdrantConnector();
