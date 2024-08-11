const app = require("./app");
const connectToDB = require("./config/db");
require("dotenv").config();

connectToDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("[✓] Server is up and running at PORT", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("[x] Error connecting to the database:", error);
    process.exit(1);
  });
