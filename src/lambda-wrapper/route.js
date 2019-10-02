import Path from 'path-parser';

import log from '../log';
import constants from '../constants';
import APIError from '../api-error';

const TAG = 'lambda-utils::lambda-wrapper::route';

export default (routes, path, method) => {
    // API gateway uses the {} delimiter for url parameters, lets use : instead
    // ie. user/{id}/cat -> user/:id/cat
    const formattedPath = path.replace(/{/g, ':').replace(/}/g, '');
    const upperCaseMethod = method.toUpperCase();

    // Iterate through the routes and find a match
    const routeMatch = Object.keys(routes).find((item) => {
        const pathMatcher = new Path(item);
        return pathMatcher.test(formattedPath);
    });
    // Check if the route has an associated method
    const routeInfo = routes[routeMatch][upperCaseMethod];
    if (!routeInfo || !routeInfo.handler) {
        log.error(
            TAG,
            'router',
            `Unable to find function. path=${formattedPath}, routes=${JSON.stringify(
                routes,
                null,
                2,
            )}`,
        );
        throw new APIError(
            'UNSUPPORTED_METHOD',
            constants.API_ERRORS.UNSUPPORTED_METHOD,
        );
    }
    return routeInfo;
};

