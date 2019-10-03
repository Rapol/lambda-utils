import mysql from 'promise-mysql';

import log from './log';
import env from './env';

let DB_CONFIG = null;

const TAG = 'lambda-utils::db';

let CACHED_CONNECTION = null;

/**
 * Returns a promise that returns a new connection if there was none or returns a cached connection.
 * It will return the same promise if a connection was already opened
 * @param {Boolean} [requireNewConnection] - True if we require a new connection.
 * @throws {Object} - throws an error if connection fails to open
 * @return {Promise<Object>} - connection
 */
function createConnection(requireNewConnection) {
    if (requireNewConnection) {
        return mysql.createConnection(DB_CONFIG).catch((err) => {
            log.error(TAG, 'createConnection', {
                requireNewConnection,
                err,
            });
            throw err;
        });
    }
    if (CACHED_CONNECTION === null) {
        CACHED_CONNECTION = mysql.createConnection(DB_CONFIG).catch((err) => {
            log.error(TAG, 'createConnection', { err });
            throw err;
        });
    }
    return CACHED_CONNECTION;
}

/**
 * Creates a sql connection and executes the function with the connection as the first parameter
 * @param {Function} fn - function that is asking for a sql connection
 * @param {Boolean} [requireNewConnection] - True if we require a new connection.
 * @return {Promise<Object>} - result of the fn
 */
function getSqlConnection(fn, { requireNewConnection }) {
    if (!DB_CONFIG) {
        DB_CONFIG = env.getDBConfig();
    }
    // If function is not passed, return the promise
    if (!fn) {
        return createConnection(requireNewConnection);
    }
    // If function is passed, called the fn by passing the connection
    return createConnection(requireNewConnection).then(conn => fn(conn));
}

/**
 * Tries to close the connection if its not null, nullifies the connection so that it can be used
 * again by another session
 * @param {object} [connection] An optional connection to close if not the cached connection.
 * @return {Promise<Object>}
 */
function closeSqlConnection(connection) {
    log.debug(TAG, 'closeSqlConnection', { message: 'closing connection', connectionPassed: Boolean(connection) });
    if (connection) {
        return connection.end().catch((err) => {
            // swallow any errors thrown while trying to close the connection
            log.warn(TAG, 'closeSqlConnection', { err });
        });
    } else if (CACHED_CONNECTION !== null) {
        return CACHED_CONNECTION.then((conn) => {
            CACHED_CONNECTION = null;
            return (
                conn
                    .end()
                    // swallow any errors thrown while trying to close the connection
                    .catch((err) => {
                        log.warn(TAG, 'closeSqlConnection', { err });
                    })
            );
        });
    }
    return Promise.resolve();
}
async function performTransaction(fn, _connection) {
    const connectionPassed = Boolean(_connection);
    let connection = _connection;
    if (!connectionPassed) {
        connection = await getSqlConnection(null, true);
    }
    await connection.beginTransaction();
    try {
        await fn(connection);
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        if (!connectionPassed) {
            await closeSqlConnection(connection);
        }
    }
    return null;
}

export {
    getSqlConnection,
    closeSqlConnection,
    performTransaction,
};
