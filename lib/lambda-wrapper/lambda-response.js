"use strict";

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _log = _interopRequireDefault(require("../log"));

var _env = _interopRequireDefault(require("../env"));

var _constants = _interopRequireDefault(require("../constants"));

var _apiError = _interopRequireDefault(require("../api-error"));

var _utils = require("../utils");

var _db = require("../db");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TAG = 'lambda-utils::lambda-wrapper::lambda-response';

function lambdaResponse({
  payload,
  allowCORS = false
}) {
  const response = {
    statusCode: payload.statusCode,
    body: payload.body ? JSON.stringify(payload.body) : '',
    headers: payload.headers || {}
  };

  if (allowCORS) {
    response.headers['Access-Control-Allow-Origin'] = '*';
  }

  _log.default.debug(TAG, 'lambdaResponse', {
    response
  });

  return response;
}

function errorResponse(payload) {
  return lambdaResponse({
    payload
  });
}

function corsErrorResponse(payload) {
  return lambdaResponse({
    payload,
    allowCORS: true
  });
}

function successResponse(payload) {
  return lambdaResponse({
    payload,
    statusCode: 200
  });
}

function corsSuccessResponse(payload) {
  return lambdaResponse({
    payload,
    allowCORS: true
  });
}
/**
 * Returns a formatted error to the client. Most errors handled here are from SQL or AWS.
 * Throttling exceptions are caught here, else it throws a generic 422 error.
 * @param {Object} err - thrown err
 * @return {Object} formatted error
 */


function formatErrorResponse(err) {
  // handle unexpected errors that were not formatted
  if (!err || !err.status) {
    return {
      status: 500,
      error: 'Internal server error'
    };
  }

  return {
    status: err.code === 'ThrottlingException' || err.code === 'TooManyRequestsException' || err.code === 'ProvisionedThroughputExceededException' ? 429 : 422,
    error: err.code || err.name,
    message: _env.default.isDev() ? err.message : null
  };
}
/**
 * Error handler used by the last catch in the handler function
 * @param {Object} err
 * */


function catchAndFormatError(err) {
  const stringfiedError = JSON.stringify(err, ['message', 'arguments', 'type', 'name', 'error', 'status', 'statusCode', 'status', 'stack', 'lineNumber', 'fileName'], 2);
  const response = {}; // Catch sql errors

  if (err.sqlState) {
    _log.default.error(TAG, 'catchAndFormatError::SQL_ERROR', stringfiedError);

    response.statusCode = _constants.default.API_ERRORS.SQL_ERROR.status;
    response.body = _constants.default.API_ERRORS.SQL_ERROR;
  } else if (err instanceof Error) {
    if (err instanceof _apiError.default || err.constructor.name === 'APIError' || err.payload && err.payload.status) {
      _log.default.error(TAG, 'catchAndFormatError::APIError', stringfiedError);

      response.statusCode = err.payload.status;
      response.body = err.payload;
    } else if (err.name === 'ValidationError') {
      _log.default.error(TAG, 'catchAndFormatError::ValidationError', stringfiedError);

      const validationError = (0, _utils.formatJoiError)(err);
      response.statusCode = validationError.status;
      response.body = validationError;
    } else {
      // catch all other Error types
      _log.default.error(TAG, 'catchAndFormatError::Error', stringfiedError);

      const formattedError = formatErrorResponse(err);
      response.statusCode = formattedError.status;
      response.body = formattedError;
    }
  } else {
    // Catch non Error objects
    _log.default.error(TAG, 'catchAndFormatError::DefaultError', stringfiedError);

    const formattedError = formatErrorResponse(err);
    response.statusCode = formattedError.status;
    response.body = formattedError;
  }

  return corsErrorResponse(response);
}

async function successCB(response) {
  const FUNCTION_TAG = 'successCB';

  _log.default.debug(TAG, FUNCTION_TAG, response);

  await (0, _db.closeSqlConnection)();
  return corsSuccessResponse(response);
}

async function failCB(err) {
  await (0, _db.closeSqlConnection)();
  return catchAndFormatError(err);
}

var _default = promise => promise.then(successCB).catch(failCB);

exports.default = _default;