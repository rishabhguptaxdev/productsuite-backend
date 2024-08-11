const mongoose = require("mongoose");

const connectToDB = () => {
  return new Promise((resolve, reject) => {
    mongoose
      .connect(process.env.DB_URL)
      .then(() => {
        console.log("[✓] DB Connected");
        resolve();
      })
      .catch((error) => {
        console.error("[x] Error occured while connecting to DB", error);
        throw error;
      });
  });
};

module.exports = connectToDB;
