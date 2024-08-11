const Survey = require("../models/survey");

exports.isClosed = async (req, res, next) => {
  try {
    const surveyId =
      req.query.surveyId || req.body?.surveyId || req.params.surveyId;
    const survey = await Survey.findOne({ _id: surveyId }, { isClosed: 1 });
    if (survey?.isClosed) {
      return res.json({ isClosed: true });
    }
    next();
  } catch (error) {
    console.error("Error: ", error);
  }
};
