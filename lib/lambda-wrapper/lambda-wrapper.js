"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lambdaResponse = _interopRequireDefault(require("./lambda-response"));

var _db = require("../db");

var _log = _interopRequireDefault(require("../log"));

var _route = _interopRequireDefault(require("./route"));

var _formatEvent = _interopRequireDefault(require("./format-event"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TAG = 'lambda-utils::lambda-wrapper::lambda-wrapper';

const lambdaWrapper = (routes, functionTag, opts = {}) => (event, context) => {
  // cloudwatch even catcher
  if (event.source === 'aws.events') {
    return Promise.resolve('pinged');
  }

  const formatedEvent = (0, _formatEvent.default)(event);

  _log.default.initLogger(formatedEvent, _log.default.LOG_TYPES.GENERAL, _log.default.LOG_LEVELS.DEBUG, opts.logMask, opts.awsEventMask);

  if (opts.logInitialEvent) _log.default.info(TAG, `${functionTag}_EVENT`, formatedEvent);
  const routeInfo = (0, _route.default)(routes, formatedEvent.requestContext.resourcePath, formatedEvent.requestContext.httpMethod);
  let promise = null;

  if (opts.dbConnection) {
    // pass db connection to lambda handler
    promise = (0, _db.getSqlConnection)(connection => routeInfo.handler(formatedEvent, context, routeInfo, connection));
  } else {
    promise = routeInfo.handler(formatedEvent, context, routeInfo);
  } // catch promise and format success or failure response


  return (0, _lambdaResponse.default)(promise);
};

var _default = lambdaWrapper;
exports.default = _default;