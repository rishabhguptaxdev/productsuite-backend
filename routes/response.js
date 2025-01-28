const express = require("express");
const router = express.Router();

const {
	getSurveyResponseById,
	getAllSurveyResponses,
	updateSurveyResponse,
	getLoggerId,
	surveyExperience,
} = require("../controlers/response");
const { isLoggedIn } = require("../middleware/user.middleware");
const { isClosed } = require("../middleware/response.middleware");

router.route("/surveyExperience").patch(surveyExperience);
router
	.route("/:id")
	.get(isClosed, getSurveyResponseById)
	.post(isClosed, updateSurveyResponse);
router.route("/:id/responses").get(isLoggedIn, getAllSurveyResponses);
router.route("/getLoggerId/:surveyId").post(isClosed, getLoggerId);

module.exports = router;
