'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 8000,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'stsockets-secret'
  },

  headers: [
    'authorization',
    'x-page-size',
    'x-return-post',
    'x-start-page'
  ],

  STAPI: requiredProcessEnv('STAPI'),

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    expireAfter: process.env.REDIS_EXPIRE_AFTER,
    db: process.env.REDIS_DATABASE || 1
  }

};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
