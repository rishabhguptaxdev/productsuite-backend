const app = require("./app");
const connectToDB = require("./config/db");

require("dotenv").config();

connectToDB()
	.then(async () => {
		app.listen(process.env.PORT || 5050, () => {
			console.log("[✓] Server is up and running at PORT", process.env.PORT);
		});
	})
	.catch((error) => {
		console.error("[x] Error starting app:", error);
		process.exit(1);
	});
