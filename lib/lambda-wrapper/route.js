"use strict";

require("core-js/modules/es.string.replace");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pathParser = _interopRequireDefault(require("path-parser"));

var _log = _interopRequireDefault(require("../log"));

var _constants = _interopRequireDefault(require("../constants"));

var _apiError = _interopRequireDefault(require("../api-error"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TAG = 'lambda-utils::lambda-wrapper::route';

var _default = (routes, path, method) => {
  // API gateway uses the {} delimiter for url parameters, lets use : instead
  // ie. user/{id}/cat -> user/:id/cat
  const formattedPath = path.replace(/{/g, ':').replace(/}/g, '');
  const upperCaseMethod = method.toUpperCase(); // Iterate through the routes and find a match

  const routeMatch = Object.keys(routes).find(item => {
    const pathMatcher = new _pathParser.default(item);
    return pathMatcher.test(formattedPath);
  }); // Check if the route has an associated method

  const routeInfo = routes[routeMatch][upperCaseMethod];

  if (!routeInfo || !routeInfo.handler) {
    _log.default.error(TAG, 'router', `Unable to find function. path=${formattedPath}, routes=${JSON.stringify(routes, null, 2)}`);

    throw new _apiError.default('UNSUPPORTED_METHOD', _constants.default.API_ERRORS.UNSUPPORTED_METHOD);
  }

  return routeInfo;
};

exports.default = _default;