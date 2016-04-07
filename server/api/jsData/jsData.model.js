'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.controller');
let config = require('../../config/environment');
let makeRequest = require('./makeRequest');
let redis = require('../../config/redis');

function getResourceName(urlParams, resource) {
  let resourceName = urlParams && urlParams.pool + '/' + urlParams.resource;
  resourceName = resourceName ? resourceName
    : resource;
  return resourceName;
}

exports.findAll = function (req, resource, params, options) {
  let urlParams = req && req.params;
  let query = req && req.query || params;
  let headers = _.pick(req && req.headers || options.headers, config.headers);

  let resourceName = getResourceName(urlParams, resource);

  return new Promise(function (resolve, reject) {
    let opts = {
      qs: query,
      url: config.STAPI + resourceName,
      method: 'GET',
      headers: headers
    };

    debug('findAll:opts', opts);

    makeRequest(opts, (fromBackend) => {
      resolve(fromBackend.data);
    }, reject);
  });

};

exports.find = function (req, resource, id, options) {
  let urlParams = req && req.params;
  let headers = _.pick(req && req.headers || options.headers, config.headers);
  id = urlParams && urlParams.id || id;

  let resourceName = getResourceName(urlParams, resource);
  // TODO: get expire time from config by resource name
  let expireRedisAfter = 120000;

  return new Promise(function (resolve, reject) {
    let hash = config.STAPI + resourceName;
    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };
    let minUts = Date.now() - expireRedisAfter;

    redis.hgetAsync(hash, id)
      .then((inRedis) => {

        if (inRedis && inRedis.data && inRedis.uts > minUts) {

          debug('find:redis', `${hash}#${id} (${inRedis.uts})`);
          resolve(inRedis.data);

        } else {

          debug('find:makeRequest', opts);

          makeRequest(opts, (fromBackend) => {
            if (fromBackend && fromBackend.data) {
              fromBackend.uts = Date.now();
              redis.hsetAsync(hash, id, fromBackend);
              resolve(fromBackend.data);
            } else {
              reject({
                error: 'Invalid backend response',
                response: response
              });
            }
          }, reject);

        }

      })
      .catch((err)=> {
        console.error('jsData:find:redis:error', err);
        debug('find:makeRequest', opts);
        makeRequest(opts, resolve, reject);
      });

  });
};

exports.create = function (req, resource, attrs, headers) {
  let urlParams = req && req.params;
  headers = _.pick(req && req.headers || headers, config.headers);
  let resourceName = getResourceName(urlParams, resource);

  debug('resourceName', resourceName);
  console.log(resourceName);
  return new Promise(function (resolve, reject) {
    let url = config.STAPI + resourceName;
    let opts = {
      url: url,
      method: 'POST',
      headers: headers,
      json: attrs
    };
    makeRequest(opts, (fromBackend) => {
      if (fromBackend && fromBackend.data) {
        fromBackend.uts = Date.now();
        debug('fromBackend', fromBackend);
        resolve(fromBackend.data);
      } else {
        reject({
          error: 'Invalid backend response',
          response: response
        });
      }
    }, reject);
  });

};

exports.update = function (req, resource, id, attrs, headers) {
  let urlParams = req && req.params;
  headers = _.pick(req && req.headers || headers, config.headers);
  let resourceName = getResourceName(urlParams, resource);

  console.log(attrs);
  return new Promise(function (resolve, reject) {
    let url = config.STAPI + resourceName + '/' + id;
    let opts = {
      url: url,
      method: 'PUT',
      headers: headers,
      json: attrs
    };
    makeRequest(opts, (fromBackend) => {
      if (fromBackend && fromBackend.data) {
        fromBackend.uts = Date.now();
        debug('fromBackend', fromBackend);
        resolve(fromBackend.data);
      } else {
        reject({
          error: 'Invalid backend response',
          response: response
        });
      }
    }, reject);
  });
};
