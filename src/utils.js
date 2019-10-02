import Joi from 'joi';

import APIError from './api-error';
import constants from './constants';

/**
 * Validates the callee
 * @param {String} identityId - id received from the AWS Authentication header
 * @param {String} [realIdentityId] - realIdentityId in params
 * @throws {constants.API_ERRORS.COGNITO_UNAUTHORIZED} - identityId is not present
 * @throws {constants.API_ERRORS.FORBIDDEN} - user does not have permission to access the account
 * @return {Promise}
 */
async function validateUser(identityId, realIdentityId) {
    // Check if identityId is present
    if (!identityId) {
        throw new APIError(
            'COGNITO_UNAUTHORIZED',
            constants.API_ERRORS.COGNITO_UNAUTHORIZED,
        );
    }
    // If callee (identityId) is not equal to the id in the params, throw forbidden
    if (realIdentityId && identityId !== realIdentityId) {
        throw new APIError('FORBIDDEN', constants.API_ERRORS.FORBIDDEN);
    }
    return identityId;
}

function formatJoiError(error) {
    const errorResponse = error.details[0];
    errorResponse.status = 400;
    errorResponse.error = 'ValidationError';
    return errorResponse;
}

/**
 * Validates an object against a Joi schema
 * @param {Object} object - object to be validated
 * @param {Object} schema - Joi schema
 * @return {Promise<Object>}
 */
async function validateEvent(object, schema, allowUnknown = true) {
    const validationResult = Joi.validate(object, schema, { allowUnknown });
    if (validationResult.error !== null) {
        throw validationResult.error;
    }
    return validationResult.value;
}

/**
 * Safely access any property in the object, returning the default if not found
 * @param {Object} obj The input object.
 * @param {String[]} props The array of properties to be read.
 * @param {Object} defaultValue Returned if the property not found.
 * */
function deepGet(obj, props, defaultValue) {
    // If we have reached an undefined/null property
    // then stop executing and return the default value.
    // If no default was provided it will be undefined.
    if (obj === undefined || obj === null) {
        return defaultValue;
    }

    // If the path array has no more elements, we've reached
    // the intended property and return its value
    if (props.length === 0) {
        return obj;
    }

    // Prepare our found property and path array for recursion
    const foundSoFar = obj[props[0]];
    const remainingProps = props.slice(1);
    return deepGet(foundSoFar, remainingProps, defaultValue);
}

function safeParse(inString, theDefault) {
    let out;
    try {
        if (typeof inString === 'string') out = JSON.parse(inString);
        if (Array.isArray(theDefault) && !Array.isArray(out)) out = theDefault;
    } catch (e) {
        out = theDefault;
    }
    return out;
}

/**
 * Delays, then returns as a promise
 * @param {Integer} t Time in milliseconds to delay
 * @return {Promise<>} After t milliseconds it returns nothing
 * */
function delay(t) {
    return new Promise(((resolve) => {
        setTimeout(resolve, t);
    }));
}

function getHeader(headers, name) {
    return headers && (headers[name] || headers[name.toLowerCase()]);
}

export {
    validateUser,
    validateEvent,
    formatJoiError,
    deepGet,
    safeParse,
    delay,
    getHeader,
};

