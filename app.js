const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

//Import all routes
const response = require("./routes/response");
const survey = require("./routes/survey");
const user = require("./routes/user");

require("dotenv").config();

const app = express();

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookies and middlewares
app.use(cookieParser());

// Enable CORS for all routes
app.use(cors());

app.use(morgan("tiny"));
app.use("/api/v1/response", response);
app.use("/api/v1/auth", user);
app.use("/api/v1/survey", survey);

module.exports = app;
