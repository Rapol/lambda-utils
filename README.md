# Lambda Utils

On our journey through serverless, we have found some common code base that we constantly bring
over to every new serverless project. Here lies what we have used and improved for more than a year.

WARNING: readme in internal WIP

## Usage

### Lamba wrapper

The lambda wrapper returns the handler function that AWS expects. It will run the user handler that you have defined in the routes file.

handler.js
```
import { lambdaWrapper } from 'lambda-utils';

import routes from './routes';

export default lambdaWrapper(routes, 'SERVICE_NAME', {
    dbConnection: false,
});
```

routes.js
```
export default {
    '/accounts/:accountId/categories': {
        GET: {
            handler: handlers.getCategories,
            response: {
                headers: {},
                statusCode: 200,
            },
        },
    }
}
```

Lambda wrapper will pass event, context and a routeInfo object which is the json object
defined in routes.js.

getCategories.js
```
function getCategories(_event, context, routeInfo) {
    const FUNCTION_TAG = 'GET_CATEGORIES';
    const event = Object.assign({}, _event);
    log.debug(TAG, `${FUNCTION_TAG}_EVENT_INIT`);
    return validateUser(event.pathParameters.accountId, event.requestContext.identity.cognitoIdentityId)
        .then(() => categoryManager.getCategories(event.pathParameters.accountId))
        .then((data) => {
            log.kpi(TAG, `${FUNCTION_TAG}_EVENT_SUCCESS`, data);
            const { statusCode } = routeInfo.response;
            return {
                statusCode,
                headers: null,
                body: {
                    status: statusCode,
                    data,
                },
            };
        })
        .catch((err) => {
            log.error(TAG, `${FUNCTION_TAG}_EVENT_FAILURE`, {
                pathParameters: event.pathParameters,
                queryParameters: event.queryStringParameters,
                body: event.body,
            });
            throw err;
        });
}
```

### ApiError

Error constructor used to return an API error to the client.

```
ApiError(nameOfError, payload, opt)
```

```
throw new ApiError(
    constants.API_ERRORS.categoryConflict.error,
    {
        status: 409,
        error: 'Conflict',
        message: 'Category with same name already exists',
    }
);
```

### DB

```
import { log, db } from 'lambda-utils';

const { getSqlConnection } = db;

// pass connection to callback function
const rows = await getSqlConnection(connection => connection.query(
    `SELECT *
    FROM account
    WHERE accountId = ?`,
    [accountId],
));

// OR

// return connection object if no callback is specified
const connection = await this.getSqlConnection();
const result = await connection.query(sql, args);
```

# Babel

This boilerplate uses `@babel/preset-env` with a target of node 8.10.

# Features
* Build with [Babel](https://babeljs.io). (ES6 -> ES5)
* Test with [mocha](https://mochajs.org).
* Cover with [istanbul](https://github.com/gotwarlost/istanbul).
* Check with [eslint](eslint.org).

# Commands
- `npm run clean` - Remove `lib/` directory
- `npm test` - Run tests. Tests can be written with ES6 (WOW!)
- `npm test:watch` - You can even re-run tests on file changes!
- `npm run cover` - Yes. You can even cover ES6 code.
- `npm run lint` - We recommend using [airbnb-config](https://github.com/airbnb/javascript/tree/master/packages/eslint-config-airbnb). It's fantastic.
- `npm run test:examples` - We recommend writing examples on pure JS for better understanding module usage.
- `npm run build` - Do some magic with ES6 to create ES5 code.
- `npm run prepublish` - Hook for npm. Do all the checks before publishing you module.