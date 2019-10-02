import lambdaResponse from './lambda-response';
import { getSqlConnection } from '../db';
import log from '../log';
import route from './route';
import formatEvent from './format-event';

const TAG = 'lambda-utils::lambda-wrapper::lambda-wrapper';

const lambdaWrapper = (routes, functionTag, opts = {}) => (event, context) => {
    // cloudwatch even catcher
    if (event.source === 'aws.events') {
        return Promise.resolve('pinged');
    }
    const formatedEvent = formatEvent(event);
    log.initLogger(
        formatedEvent,
        log.LOG_TYPES.GENERAL,
        log.LOG_LEVELS.DEBUG,
        opts.logMask,
        opts.awsEventMask,
    );
    if (opts.logInitialEvent) log.info(TAG, `${functionTag}_EVENT`, formatedEvent);
    const routeInfo = route(
        routes,
        formatedEvent.requestContext.resourcePath,
        formatedEvent.requestContext.httpMethod,
    );
    let promise = null;
    if (opts.dbConnection) {
        // pass db connection to lambda handler
        promise = getSqlConnection(connection =>
            routeInfo.handler(formatedEvent, context, routeInfo, connection));
    } else {
        promise = routeInfo.handler(formatedEvent, context, routeInfo);
    }
    // catch promise and format success or failure response
    return lambdaResponse(promise);
};

export default lambdaWrapper;
