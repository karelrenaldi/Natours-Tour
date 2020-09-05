/* Error Handling Production :
    1) Duplicate Database Field
    2) Invalid Database ID
    3) Mongoose Validation Error
*/

const ErrorHandling = require("../utils/errorHandling");

const sendErrorDev = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (res, error) => {
  // Operational, trusted error : send message to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });

    // Programming or other unknown error : don't leak error details
  }

  // 1) Log error
  console.error("Error", error);
  // 2) Send generic message
  res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

const handleCastErrorDB = (err) =>
  new ErrorHandling(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

  return new ErrorHandling(
    `Duplicate field value: ${value}. Please use another value`,
    400
  );
};

const handleValidationErrorDB = (error) => {
  const messageList = Object.values(error.errors)
    .map((value) => value.message)
    .join(". ");

  return new ErrorHandling(messageList, 400);
};

const handleJWTError = () =>
  new ErrorHandling("Invalid! token please login again", 401);

const handleJWTExpiredError = () =>
  new ErrorHandling("Your token has expired! please login again", 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(res, err);
  } else if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(res, error);
  }
};
