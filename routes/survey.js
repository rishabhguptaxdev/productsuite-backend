import express from "express";
import {
	createSurvey,
	getAllSurveys,
	getSurveyById,
	changeStatusOfSurvey,
} from "../controlers/survey.js";
import { isLoggedIn } from "../middleware/user.middleware.js";
import { isClosed } from "../middleware/response.middleware.js";

const router = express.Router();

router.route("/").get(isLoggedIn, getAllSurveys).post(isLoggedIn, createSurvey);
router.route("/:id").get(isClosed, getSurveyById);
router.route("/:id/status").patch(changeStatusOfSurvey);

export default router;
