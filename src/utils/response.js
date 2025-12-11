/**
 * Utility untuk response API yang konsisten
 */

/**
 * Response sukses
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Response error
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Response unauthorized
 */
const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Response forbidden
 */
const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Response not found
 */
const notFoundResponse = (res, message = 'Not Found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Response validation error
 */
const validationErrorResponse = (res, errors, message = 'Validation Error') => {
  return res.status(422).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse
};
