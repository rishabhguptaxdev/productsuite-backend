const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // name: {
  //   type: String,
  //   required: [true, "Please provide name"],
  //   maxlength: [30, "Name length should not exceed 30 characters"],
  // },
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: [validator.isEmail, "Please provide valid email"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: [5, "Min length of password should be 5"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordExpiry: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

// encrypt password before saving it -- HOOKS
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// create and return jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

// validate the password with password sent by the user
userSchema.methods.isValidPassword = async function (passwordSentByUser) {
  return await bcrypt.compare(passwordSentByUser, this.password);
};

// generate forgot password token(string)
userSchema.methods.getForgotPasswordToken = function () {
  const forgotPasswordToken = crypto.randomBytes(20).toString("hex");

  // getting a hash - make sure to get a hash on backend
  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotPasswordToken)
    .digest("hex");

  // set time of token
  this.forgotPasswordExpiry =
    Date.now() + process.env.FORGOT_TOKEN_EXPIRY * 60 * 1000;

  return forgotPasswordToken;
};

module.exports = mongoose.model("User", userSchema);
