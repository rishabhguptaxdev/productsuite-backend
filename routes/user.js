const express = require("express");
const router = express.Router();

const { login, signup, signupOrLogin } = require("../controlers/user");

// router.route("/login").post(login);
// router.route("/signup").post(signup);
// This route is triggered after successful OAuth2 authentication from the provider
router.route("/signup-login").post(signupOrLogin);

module.exports = router;
