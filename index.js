import dotenv from "dotenv";
import app from "./app.js";
import mongoConnector from "./connectors/mongodb.connector.js";
import qdrantConnector from "./connectors/qdrantdb.connector.js";
import config from "./config/app.config.js";

dotenv.config();

const start = async () => {
	try {
		await Promise.all([mongoConnector.connect(), qdrantConnector.connect()]);

		app.listen(config.port, () =>
			console.log(`[✓] Server is running on port ${config.port}`)
		);
	} catch (err) {
		console.error("[x] Error during startup:", err.message);
		process.exit(1);
	}
};

start();
