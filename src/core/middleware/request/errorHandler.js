const ErrorResponse = require('../../utils/ErrorResponse.class');
const logger = require('../../../../config/logger');

async function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // log to console for development
  logger.error(err.message);
  console.debug(err.stack);

  // Mongoose Bad Object ID (Cast Error)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `No resource found for the requested id: ${err.value}`;
    error = new ErrorResponse(message, 404);
  } // Mongoose Bad Value (Cast Error)
  else if (err.name === 'CastError') {
    const message = `We look at everywhere. But not found any matching resources`;
    error = new ErrorResponse(message, 400);
  }

  // Duplication in Document field
  else if (err.name === 'MongoServerError' && err.code === 11000) {
    const duplicationKey = Object.keys(err.keyPattern)[0];
    const duplicationValue = err.keyValue[duplicationKey];
    const message = `this "${duplicationValue}" ${duplicationKey} already exists. Please choose another ${duplicationKey} for this resource.`;
    error = new ErrorResponse(message, 400);
  } // Other Mongo Error Codes
  else if (err.name === 'MongoServerError') {
    const message = `Something went wrong with configurations ${error.message}`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((it) => {
      return ` ${it.message}`;
    });
    error = new ErrorResponse(message, 400);
  }

  // Type Error response
  if (err.name === 'TypeError') {
    const message = `an unknown error occurred while processing your request. Please try again later.`;
    error = new ErrorResponse(message, 500);
  }

  return res.status(error.statusCode).json({
    success: false,
    message: error.message.trim() || 'server error',
    error: error.errors,
  });
}

module.exports = errorHandler;
