import mongoose from "mongoose";
import config from "../config/app.config.js";

class MongoConnector {
	constructor() {
		this.mongoUrl = config.mongoUrl;
		this.listenersAttached = false;
		this.options = {};
	}

	attachListeners() {
		if (this.listenersAttached) return;
		this.listenersAttached = true;

		mongoose.connection.on("connected", () =>
			console.log("[✓] MongoDB connected.")
		);
		mongoose.connection.on("disconnected", () =>
			console.warn("[!] MongoDB disconnected.")
		);
		mongoose.connection.on("error", (err) =>
			console.error("[x] MongoDB error:", err)
		);
		mongoose.connection.on("reconnected", () =>
			console.log("[∞] MongoDB reconnected.")
		);
		mongoose.connection.on("close", () =>
			console.log("[x] MongoDB connection closed.")
		);
	}

	async connect() {
		try {
			this.attachListeners();
			await mongoose.connect(this.mongoUrl, this.options);
		} catch (err) {
			console.error("[x] Initial MongoDB connection failed:", err.message);
			await this.reconnect();
		}
	}

	async reconnect() {
		console.log("[~] Attempting MongoDB reconnection...");
		await mongoose.connect(this.mongoUrl, this.options);
	}

	async disconnect() {
		await mongoose.connection.close();
		mongoose.connection.removeAllListeners();
		this.listenersAttached = false;
	}
}

export default new MongoConnector();
