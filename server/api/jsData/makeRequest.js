'use strict';
let request = require('request');
let debug = require('debug')('sts:makeRequest');

module.exports = function makeRequest(options, resolve, reject) {

  let result;
  request(options, function (error, response, body) {
    if (error) {
      debug('Error occurred:', error);
      return reject();
    }

    if (response.statusCode === 404) {
      return reject(404);
    }

    if (response.statusCode === 204) {
      return resolve({
        date: response.headers.date
      });
    }

    if (response.statusCode === 401) {
      return reject(401);
    }

    if (body) {
      try {
        //debug(body);
        result = JSON.parse(body);
      } catch (err) {
        debug('JSON.parse error:', err);
        return reject();
      }
    }

    return resolve({
      eTag: response.headers.etag,
      date: response.headers.date,
      data: result
    });
  });

};
