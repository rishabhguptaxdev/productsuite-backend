const express = require("express");
const router = express.Router();

const {
  createSurvey,
  getAllSurveys,
  getSurveyById,
  changeStatusOfSurvey,
} = require("../controlers/survey");
const { isLoggedIn } = require("../middleware/user.middleware");
const { isClosed } = require("../middleware/response.middleware");

router.route("/").get(isLoggedIn, getAllSurveys).post(isLoggedIn, createSurvey);
router.route("/:id").get(isClosed, getSurveyById);
router.route("/:id/status").patch(changeStatusOfSurvey);

module.exports = router;
