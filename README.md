# Lambda Utils

On our journey through serverless, we have found some common code base that we constantly bring
over to every new serverless project. The lambda-utils module exposes these in one package.

## Usage

### Lamba wrapper

Lambda wrapper lets us add reusable code that will be perform before and after your code runs. Instead of defining your handler alone,
you will define the handler and wrap it with the lambda wrapper. The lambda wrapper helps you in:
- Acquiring and releasing SQL connection during start up and tear down of each lambda call
- Define a monolitc function that will handle multiple endpoints
- Format request event (ie urlDecode request parameters)
- Abstract return response to cloud provider
- Standarize request logs

```
import { lambdaWrapper } from 'lambda-utils';

// define routes with their handlers and response
const routes = {
    '/users': {
        GET: {
            handler: handlers.getUsers,
            response: {
                headers: {},
                statusCode: 200,
            },
        },
    }
}

// export a service called USER wrapped in the lambda wrapper
export default lambdaWrapper(routes, 'USER');
```

NOTE: Lambda Wrapper only supports AWS Lambda

#### Monolitc lambda router

The lambda wrapper allows us to implement a [Service Pattern](https://serverless.com/blog/serverless-architecture-code-patterns/) very easily. In a Service Pattern, a single Lambda function can handle a few tasks that are usually related. For example, a user lambda would handle all routes under the /user path. The lambda wrapper provides the routing logic of the different handlers define in the service

In the previous example, we have only defined one route. But we can define multiple routes to apply a monolitic pattern.

```
const routes = {
    '/users': {
        GET: {
            handler: handlers.getUsers,
            response: {
                headers: {},
                statusCode: 200,
            },
        },
    }
    '/users': {
        POST: {
            handler: handlers.createUser,
            response: {
                headers: {},
                statusCode: 201,
            },
        },
    }
}
```

Benefits of the Service Pattern: 
- Less Lambda functions that you need to manage.
- Some separation of concerns exists.
- Teams can work autonomously.
- Faster deployments.
- Theoretically better performance. When multiple jobs are within a Lambda function, there is a higher likelihood that Lambda function will be called more regularly, which means the Lambda will stay warm and users will run into less cold-starts.

#### Response

The handler gets passed a routerInfo object that contains the static headers and status response for a successful response.

```
function users(event, context, routeInfo, connection) {
    const { statusCode, headers } = routeInfo.response;
    return {
        statusCode,
        headers,
        body: {
            status: statusCode,
            data,
        },
    };
}
```

#### SQL Connection

The wrapper provides the ability to create and close SQL connections. To ask for a SQL connection you must set the `dbConnection` option:

```
// SQL onnection will be passed as an argument to your function
const getUsers = (event, context, routeInfo, connection) => console.log(connection);

const routes = {
    '/users': {
        GET: {
            handler: handlers.getUsers,
            response: {
                headers: {},
                statusCode: 200,
            },
        },
    }
}
export default lambdaWrapper(
    routes,
    'SERVICE_NAME',
    {
        dbConnection: true,
    },
);
```

The wrapper always tries to close the connection when your handler returns.

### ApiError

Error constructor used to return an API error to the client.

```
ApiError(nameOfError, payload, opt)
```

```
throw new ApiError(
    constants.API_ERRORS.userConflict.error,
    {
        status: 409,
        error: 'Conflict',
        message: 'User with same email already exists',
    }
);
```

### DB

The DB module allows you to imperatively acquire a DB connection anywhere from your handler. The module caches the DB connection which
will be close by the lambda wrapper. 

Connection can be acquired in a callback or async method.

Callback:
```
import { db } from 'lambda-utils';

const { getSqlConnection } = db;

const rows = await getSqlConnection(async connection => {
    const result = await connection.query(
    `SELECT *
    FROM account
    WHERE accountId = ?`,
    [accountId],
    );
    return result;
});
```

Async:
```
// return connection if no callback is specified
const connection = await getSqlConnection();
const result = await connection.query(sql, args);
```

You can also specify to get a new connnection in case you need to have multiple transactions. In this case, you will need to close the connection.

```
const { getSqlConnection, closeSqlConnection } = db;

const connection = await getSqlConnection(null, { requireNewConnection: true });
const result = await connection.query(sql, args);
closeSqlConnection(connection);
```

The DB configuration is done by environment variables

```
process.env.DB_USER
process.env.DB_PASSWORD
process.env.DB_NAME
process.env.DB_HOST
process.env.DB_PORT
```

### Logger

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