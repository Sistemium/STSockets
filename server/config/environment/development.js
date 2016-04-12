'use strict';

// Development specific configuration
// ==================================
module.exports = {
  port: process.env.PORT || 8000,

  STAPI: process.env.STAPI || 'https://api.sistemium.com/v4d/',
  APIv1: process.env.APIv1 || 'https://api.sistemium.com/api2/v1/',
  APIv3: process.env.APIv3 || 'https://api.sistemium.com/api2/v3/'

};
