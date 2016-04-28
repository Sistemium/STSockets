'use strict';
let request = require('request');
let debug = require('debug')('sts:makeRequest');
let _ = require('lodash');

module.exports = function makeRequest(options, resolve, reject) {

  let result;
  request(options, function (error, response, body) {
    if (error) {
      debug('Error occurred:', error);
      return reject(500);
    }

    if (response.statusCode >= 400) {
      console.error('makeRequest error', response.statusCode, options, response.body);
      return reject(response.statusCode);
    }

    if (response.statusCode === 204) {
      return resolve({
        date: response.headers.date,
        status: response.statusCode
      });
    }

    if (body && _.isString(body)) {
      try {
        //debug(body);
        result = JSON.parse(body);
      } catch (err) {
        debug('JSON.parse error:', err);
        return reject();
      }
    } else {
      result = body;
    }

    return resolve({
      eTag: response.headers.etag,
      date: response.headers.date,
      data: result,
      status: response.statusCode
    });
  });

};
