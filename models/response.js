const mongoose = require("mongoose");

const surveyResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
  },
  questions: [
    {
      question: String,
      response: String,
    },
  ],
  max_questions: Number,
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Response", surveyResponseSchema);
