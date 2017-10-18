'use strict';

const request = require('request');
const debug = require('debug')('sts:makeRequest');
const _ = require('lodash');


module.exports = makeRequest;


function makeRequest(options, resolve, reject) {

  let result;

  request(options, (error, response, body) => {

    if (error) {

      debug('Error occurred:', error);

      return reject({
        status: response && response.status || 500,
        text: body || 'Internal server error'
      });

    }

    if (response.statusCode >= 400) {

      console.error('makeRequest error', response.statusCode, options, response.body);

      return reject({
        status: response.statusCode,
        text: response.body
      });

    }

    if (response.statusCode === 204) {

      let xOffset = _.get(response, 'headers.x-offset');

      let res = {
        date: response.headers.date,
        status: response.statusCode
      };

      if (xOffset) {
        res.xOffset = xOffset;
      }

      return resolve(res);

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
      xOffset: response.headers['x-offset'],
      eTag: response.headers.etag,
      date: response.headers.date,
      data: result,
      status: response.statusCode
    });

  });

}
