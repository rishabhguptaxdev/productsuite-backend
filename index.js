import dotenv from "dotenv";
import connectToDB from "./config/db.js";
import app from "./app.js";

dotenv.config();

connectToDB()
	.then(() => {
		app.listen(process.env.PORT || 5050, () => {
			console.log("[✓] Server is up and running at PORT", process.env.PORT);
		});
	})
	.catch((error) => {
		console.error("[x] Error starting app:", error);
		process.exit(1);
	});
