class CustomError extends Error {
  constructor(msg, statusCode = 500, details = {}) {
    super(msg);
    this.name = this.constructor.name;
    this.code = statusCode;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = CustomError;
