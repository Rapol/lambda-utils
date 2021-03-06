"use strict";

require("core-js/modules/es.promise");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSqlConnection = getSqlConnection;
exports.closeSqlConnection = closeSqlConnection;
exports.performTransaction = performTransaction;

var _promiseMysql = _interopRequireDefault(require("promise-mysql"));

var _log = _interopRequireDefault(require("./log"));

var _env = _interopRequireDefault(require("./env"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    return _promiseMysql.default.createConnection(DB_CONFIG).catch(err => {
      _log.default.error(TAG, 'createConnection', {
        requireNewConnection,
        err
      });

      throw err;
    });
  }

  if (CACHED_CONNECTION === null) {
    CACHED_CONNECTION = _promiseMysql.default.createConnection(DB_CONFIG).catch(err => {
      _log.default.error(TAG, 'createConnection', {
        err
      });

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


function getSqlConnection(fn, {
  requireNewConnection
}) {
  if (!DB_CONFIG) {
    DB_CONFIG = _env.default.getDBConfig();
  } // If function is not passed, return the promise


  if (!fn) {
    return createConnection(requireNewConnection);
  } // If function is passed, called the fn by passing the connection


  return createConnection(requireNewConnection).then(conn => fn(conn));
}
/**
 * Tries to close the connection if its not null, nullifies the connection so that it can be used
 * again by another session
 * @param {object} [connection] An optional connection to close if not the cached connection.
 * @return {Promise<Object>}
 */


function closeSqlConnection(connection) {
  _log.default.debug(TAG, 'closeSqlConnection', {
    message: 'closing connection',
    connectionPassed: Boolean(connection)
  });

  if (connection) {
    return connection.end().catch(err => {
      // swallow any errors thrown while trying to close the connection
      _log.default.warn(TAG, 'closeSqlConnection', {
        err
      });
    });
  } else if (CACHED_CONNECTION !== null) {
    return CACHED_CONNECTION.then(conn => {
      CACHED_CONNECTION = null;
      return conn.end() // swallow any errors thrown while trying to close the connection
      .catch(err => {
        _log.default.warn(TAG, 'closeSqlConnection', {
          err
        });
      });
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