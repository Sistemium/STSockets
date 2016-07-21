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
    'x-start-page',
    'user-agent'
  ],

  AWS: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    expireAfter: process.env.REDIS_EXPIRE_AFTER || 30,
    db: process.env.REDIS_DATABASE || 0
  },

  apiV4: function (resource) {

    if (!resource) {
      console.error ('apiV4 empty resource');
      return false;
    }

    var org = resource.match (/(^[^\/]*)\/(.*)/);
    var key = 'APIv4';
    var orgKey = key + (org ? '_' + org[1] : '');

    if (org && this[orgKey]) {
      return this[orgKey] + org [2];
    }

    return this [key] + resource;

  },

  pha: {
    roles: process.env.PHA_ROLES || 'https://api.sistemium.com/pha/roles'
  }

};

_.each (process.env, function(val, key) {

  if (/APIv\d.*/.test(key)) {
    all [key] = val;
  }

});

// Export the config object based on the NODE_ENV
// ==============================================
var config = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});

console.log ('Config:', config);

module.exports = config;
