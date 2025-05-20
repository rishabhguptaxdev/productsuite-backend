import express from "express";
import { signupOrLogin } from "../controlers/user.js";

const router = express.Router();

// This route is triggered after successful OAuth2 authentication from the provider
router.route("/signup-login").post(signupOrLogin);

export default router;
