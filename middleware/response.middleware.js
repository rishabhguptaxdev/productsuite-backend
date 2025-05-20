import Survey from "../models/survey.js";

export const isClosed = async (req, res, next) => {
	try {
		const surveyId =
			req.query.surveyId || req.body?.surveyId || req.params.surveyId;

		const survey = await Survey.findOne({ _id: surveyId }, { isClosed: 1 });

		if (survey?.isClosed) {
			return res.json({ isClosed: true });
		}

		next();
	} catch (error) {
		console.error("Error in isClosed middleware:", error);
		res
			.status(500)
			.json({ message: "Server error while checking survey status" });
	}
};
