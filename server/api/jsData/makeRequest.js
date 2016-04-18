'use strict';
let request = require('request');
let debug = require('debug')('sts:makeRequest');
let _ = require('lodash');

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

    if (response.statusCode >= 500) {
      console.error(response.body);
      return reject(response.statusCode);
    }

    if (response.statusCode === 204) {
      return resolve({
        date: response.headers.date
      });
    }

    if (response.statusCode === 401) {
      return reject(401);
    }

    if (_.isString(body) && !(body === '')) {
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
