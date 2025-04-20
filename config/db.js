const mongoose = require("mongoose");

const connectToDB = () => {
	return new Promise((resolve, reject) => {
		mongoose
			.connect(process.env.DB_URL)
			.then(() => {
				console.log("[✓] MongoDB Connected");
				resolve();
			})
			.catch((error) => {
				console.error("[x] Error occured while connecting to MongoDB", error);
				throw error;
			});
	});
};

module.exports = connectToDB;
