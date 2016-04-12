'use strict';

var path = require('path');
var _ = require('lodash');


// All configurations will extend these options
// ============================================
var all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 8000,


  headers: [
    'authorization',
    'x-page-size',
    'x-return-post',
    'x-start-page'
  ],

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    expireAfter: process.env.REDIS_EXPIRE_AFTER || 600000,
    db: process.env.REDIS_DATABASE || 0
  }

};

// Export the config object based on the NODE_ENV
// ==============================================
var config = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});

console.log ('Config:', config);

module.exports = config;
