"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Constructor for the API Errors
 * @param {String} type - Type of the error. Example "INVALID_AP_SERIALNUMBER"
 * @param {Object} payload - Object that will be returned to the user
 * @param {...params} error params
 * */
class APIError extends Error {
  constructor(type, payload, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params); // Maintains proper stack trace for where our error was thrown (only available on V8)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    } // Custom debugging information


    this.type = type;
    this.payload = payload;
    this.date = new Date();
  }

}

exports.default = APIError;