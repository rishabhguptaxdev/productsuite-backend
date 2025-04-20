const app = require("./app");
const connectToDB = require("./config/db");
const axios = require("axios");

require("dotenv").config();

connectToDB()
	.then(async () => {
		// try {
		// 	const response = await axios.get(
		// 		`${process.env.CHROMA_DB_URL}/api/v2/heartbeat`
		// 	);
		// 	console.log("[✓] Chroma DB Heartbeat:", response.data);
		// } catch (error) {
		// 	throw new Error("Chroma DB unavailable: " + error.message);
		// }

		app.listen(process.env.PORT || 5050, () => {
			console.log("[✓] Server is up and running at PORT", process.env.PORT);
		});
	})
	.catch((error) => {
		console.error("[x] Error starting app:", error);
		process.exit(1);
	});
``;
