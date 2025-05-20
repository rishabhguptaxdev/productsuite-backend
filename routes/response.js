import express from "express";
import {
	getSurveyResponseById,
	getAllSurveyResponses,
	updateSurveyResponse,
	getLoggerId,
	surveyExperience,
} from "../controlers/response.js";
import { isLoggedIn } from "../middleware/user.middleware.js";
import { isClosed } from "../middleware/response.middleware.js";

const router = express.Router();

router.route("/surveyExperience").patch(surveyExperience);

router
	.route("/:id")
	.get(isClosed, getSurveyResponseById)
	.post(isClosed, updateSurveyResponse);

router.route("/:id/responses").get(isLoggedIn, getAllSurveyResponses);

router.route("/getLoggerId/:surveyId").post(isClosed, getLoggerId);

export default router;
