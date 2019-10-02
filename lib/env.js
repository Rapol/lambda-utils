"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const TAG = 'lambda-utils:env';

if (process.env.SERVERLESS_DEBUG === 'local') {
  console.log(TAG, '', {
    message: 'Make sure you have set up the correct AWS_PROFILE, AWS_REGION, and NODE_ENV',
    AWS_PROFILE: process.env.AWS_PROFILE,
    AWS_REGION: process.env.AWS_REGION,
    NODE_ENV: process.env.NODE_ENV,
    DB_NAME: process.env.DB_NAME
  });
} else {
  console.log(TAG, {
    message: 'Running in non-local environment',
    AWS_PROFILE: process.env.AWS_PROFILE,
    AWS_REGION: process.env.AWS_REGION,
    NODE_ENV: process.env.NODE_ENV,
    DB_NAME: process.env.DB_NAME
  });
}

const DEV_ENVS = ['sandbox', 'devpilot', 'stagepilot', 'dev', 'stage'];
var _default = {
  isDev: () => process.env.SERVERLESS_DEBUG === 'local' || DEV_ENVS.indexOf(process.env.NODE_ENV) !== -1,
  isPilot: () => process.env.NODE_ENV.includes('pilot') || process.env.NODE_ENV.includes('sandbox'),
  getDBConfig: () => ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.SERVERLESS_DEBUG !== 'local' ? process.env.DB_HOST : process.env.SERVERLESS_HOST || '127.0.0.1',
    port: process.env.SERVERLESS_DEBUG !== 'local' ? process.env.DB_PORT : process.env.SERVERLESS_PORT || '9999',
    timezone: 'Z' // Force the connection to use UTC timezones, like at AWS

  })
};
exports.default = _default;