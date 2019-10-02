/**
 * This module is to provide centralized logging code for the backend in order to print out
 * to CloudWatch information needed to properly debug and the like.
 */

const MASK_STRING = '********';

const LOG_LEVELS_CONST = Object.freeze({
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERR: 3,
    KPI: 4,
});
const LOG_TYPES_CONST = Object.freeze({
    SERVICE: 0,
    DB: 1,
    GENERAL: 2,
});

let log = null;

const DEFAULT_LOG_MASK = [
    'password',
    'firstName',
    'lastName',
    'phone',
    'email',
    'username',
    'cognitoAuthenticationProvider',
    'latitude',
    'longitude',
    'lat',
    'long',
    'lng',
];

const AWS_EVENT_DEFAULT_MASK = {
    headers: [
        'User-Agent',
    ],
    pathParameters: '*',
    queryStringParameters: '*',
    body: '*',
};

class Logger {
    /**
     * Creates an instance of Logger.
     *
     * @param {any} type - NOT NULL
     * @param {any} maxLevel - NULL - DEFAULTS BASED ON ENV
     * @param {any} mask - NULL
     * @param {Object} event - AWS API gateway event
     * @param {Object} eventMask - Mask applied to the event (refer to AWS_EVENT_DEFAULT_MASK)
     *
     * @memberOf Logger

     */
    constructor(type, maxLevel, mask, awsEvent, eventMask) {
        this.logType = type >= 0 ? type : LOG_TYPES_CONST.GENERAL;
        this.logMask = mask || DEFAULT_LOG_MASK;
        this.setAwsEvent(awsEvent, eventMask);

        // If prod only show INFO and above
        if (
            process.env.NODE_ENV
            && process.env.NODE_ENV.toUpperCase() === 'PROD'
            && process.env.PROD_DEBUG !== 'true'
        ) {
            this.logMax = LOG_LEVELS_CONST.INFO;
        } else if (
            maxLevel >= LOG_LEVELS_CONST.DEBUG
            && maxLevel <= LOG_LEVELS_CONST.KPI
        ) {
            this.logMax = maxLevel;
        } else {
            // Default to DEBUG
            this.logMax = LOG_LEVELS_CONST.DEBUG;
        }

        if (this.logMask instanceof Array) {
            this.logMaskMap = this.logMask.reduce((acc, curMask) => {
                acc[curMask] = true;

                return acc;
            }, {});
        }
    }

    // Intenal use -  generate the logObj
    getPreLogObj(level, tag, data) {
        let objectToBeLogged = {
            tag,
            data,
            ...this.awsEventDefaultLog,
            time: new Date(),
            type: Object.keys(LOG_TYPES_CONST)[this.logType],
            level: Object.keys(LOG_LEVELS_CONST)[level],
        };
        if (level === LOG_LEVELS_CONST.ERR) {
            objectToBeLogged = {
                ...objectToBeLogged,
                ...this.awsEvent,
            };
        } else {
            objectToBeLogged = {
                ...objectToBeLogged,
                ...this.awsEventMaskedLog,
            };
        }
        return JSON.parse(this.stringify(objectToBeLogged));
    }

    static replacer(maskSet, key, value) {
        if (key in maskSet) {
            return MASK_STRING;
        }
        return value;
    }

    static getEventDefaultValues(event = {}) {
        if (!event || !event.requestContext) {
            return null;
        }
        // Default options to get from the request.context
        return {
            requestId: event.requestContext.requestId || null,
            resource: `${event.requestContext.httpMethod}#${event.requestContext.resourcePath}`,
            cognitoIdentityId: event.requestContext.identity
                ? event.requestContext.identity.cognitoIdentityId
                : null,
            sourceIp: event.requestContext.identity
                ? event.requestContext.identity.sourceIp
                : null,
        };
    }

    getEventMaskedValues(event, _eventMask) {
        if (!event) {
            return {};
        }
        const eventMask = _eventMask || AWS_EVENT_DEFAULT_MASK;
        // Based on eventMask mask, take in dynamic values from the AWS event
        return Object.keys(eventMask).reduce((acc, key) => {
            let targetEvent = event[key];
            if (!targetEvent) {
                return acc;
            }
            if (key === 'body') {
                // mask body object
                targetEvent = this.maskObject(targetEvent);
            }
            const permittedFields = eventMask[key];
            // If its '*', return the field entirely
            if (permittedFields === '*') {
                return {
                    [key]: targetEvent,
                    ...acc,
                };
            }
            // Reduce the permittedFileds value by returning the fields that are in the mask
            const permittedValues = permittedFields.reduce((fields, key1) => ({
                // eg: 'User-Agent': event.headers['User-Agent']
                [key1]: targetEvent[key1],
                ...fields,
            }), {});
            return {
                [key]: { ...permittedValues },
                ...acc,
            };
        }, {});
    }

    maskObject(object) {
        return JSON.parse(this.stringify(object));
    }

    stringify(object) {
        let replacer = null;
        if (this.logMask && this.logMaskMap) {
            replacer = Logger.replacer.bind(null, this.logMaskMap);
        }

        return JSON.stringify(object, replacer);
    }

    // For now we write to console so it'll get to CloudWatch
    // Also returns the logObj back, the one that got written for testing/science
    static writeToConsole(logObj, level) {
        switch (level) {
        case LOG_LEVELS_CONST.DEBUG:
        case LOG_LEVELS_CONST.INFO:
        case LOG_LEVELS_CONST.WARN:
        case LOG_LEVELS_CONST.ERR:
        case LOG_LEVELS_CONST.KPI:
            console.log(`${JSON.stringify(logObj)}\n`);
            return logObj;
        default:
            // NOTHING
            break;
        }
        return null;
    }

    debug(tag, data) {
        if (this.logMax > LOG_LEVELS_CONST.DEBUG) return null;
        const logObj = this.getPreLogObj(LOG_LEVELS_CONST.DEBUG, tag, data);
        return Logger.writeToConsole(logObj, LOG_LEVELS_CONST.DEBUG);
    }

    info(tag, data) {
        if (this.logMax > LOG_LEVELS_CONST.INFO) return null;
        const logObj = this.getPreLogObj(LOG_LEVELS_CONST.INFO, tag, data);
        return Logger.writeToConsole(logObj, LOG_LEVELS_CONST.INFO);
    }

    warn(tag, data) {
        if (this.logMax > LOG_LEVELS_CONST.WARN) return null;
        const logObj = this.getPreLogObj(LOG_LEVELS_CONST.WARN, tag, data);
        return Logger.writeToConsole(logObj, LOG_LEVELS_CONST.WARN);
    }

    error(tag, data) {
        if (this.logMax > LOG_LEVELS_CONST.ERR) return null;
        const logObj = this.getPreLogObj(LOG_LEVELS_CONST.ERR, tag, data);
        return Logger.writeToConsole(logObj, LOG_LEVELS_CONST.ERR);
    }

    kpi(tag, data) {
        if (this.logMax > LOG_LEVELS_CONST.KPI) return null;
        const logObj = this.getPreLogObj(LOG_LEVELS_CONST.KPI, tag, data);
        return Logger.writeToConsole(logObj, LOG_LEVELS_CONST.KPI);
    }

    /**
   * This function is to set the AWS event, mainly to record the requestId being handled at
   * the start of the lambda requestId
   *
   * This is not a required call
   *
   * @param event
   */
    setAwsEvent(awsEvent, eventMask) {
        this.awsEvent = awsEvent;
        this.awsEventDefaultLog = Logger.getEventDefaultValues(awsEvent);
        this.awsEventMaskedLog = this.maskObject(this.getEventMaskedValues(awsEvent, eventMask));
    }
}

function logFn(tag, event, data, level) {
    if (log) {
        return log[level](`${tag}::${event}`, data);
    }
    // console.log('WARNING: Log not initialized, fallback to console.log');
    console.log(`${tag}::${event}`, data);
    return null;
}

export default {
    initLogger: (awsEvent, type, maxLevel, mask, eventMask) => {
        log = new Logger(type, maxLevel, mask, awsEvent, eventMask);
    },
    debug: (tag, event, data) => logFn(tag, event, data, 'debug'),
    info: (tag, event, data) => logFn(tag, event, data, 'info'),
    warn: (tag, event, data) => logFn(tag, event, data, 'warn'),
    error: (tag, event, data) => logFn(tag, event, data, 'error'),
    kpi: (tag, event, data) => logFn(tag, event, data, 'kpi'),
    LOG_LEVELS: LOG_LEVELS_CONST,
    LOG_TYPES: LOG_TYPES_CONST,
    DEFAULT_LOG_MASK,
    AWS_EVENT_DEFAULT_MASK,
};
