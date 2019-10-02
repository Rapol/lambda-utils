"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  API_ERRORS: {
    COGNITO_UNAUTHORIZED: {
      status: 401,
      error: 'Unauthorized',
      message: 'Cognito Identity Id Missing'
    },
    UNAUTHORIZED: {
      status: 401,
      error: 'Unauthorized'
    },
    JWT_EXPIRED: {
      status: 401,
      error: 'Unauthorized',
      message: 'JWT expired'
    },
    FORBIDDEN: {
      status: 403,
      error: 'Forbidden'
    },
    NOT_FOUND: {
      status: 404,
      error: 'Not Found'
    },
    UNSUPPORTED_METHOD: {
      status: 405,
      error: 'Unsupported method'
    },
    SQL_ERROR: {
      status: 422,
      error: 'Unexpected Error'
    },
    INTERNAL_ERROR: {
      status: 500,
      error: 'Internal server error'
    }
  }
};
exports.default = _default;