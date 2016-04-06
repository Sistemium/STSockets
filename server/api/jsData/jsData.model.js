'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.controller');

let config = require('../../config/environment');
let JSData = require('js-data');
let DS = new JSData.DS({
  cacheResponse: false,
  bypassCache: true,
  keepChangeHistory: false,
  resetHistoryOnInject: false,
  upsert: false,
  notify: false,
  log: false
});
let DSRedisAdapter = require('js-data-redis');
let DSHttpAdapter = require('../../jsDataAdapters/httpAdapter');
let httpAdapter = new DSHttpAdapter({
  url: config.STAPI
});

let redisAdapter = new DSRedisAdapter();
DS.registerAdapter('redis', redisAdapter);
DS.registerAdapter('http', httpAdapter, {default: true});


function checkResource(params, resourceName) {
  let resource = resourceName || params.pool + '/' + params.resource;
  //define resource if not already in store
  if (Object.keys(DS.definitions).indexOf(resource) === -1) {
    DS.defineResource(resource);
  }

  return resource;
}

//TODO remove js-data
exports.findAll = function (query, headers, params, resourceName) {

  let resource = checkResource(params, resourceName);

  return new Promise(function (resolve, reject) {
    DS.findAll(resource, query || {}, {
      headers:  _.pick(headers, config.headers)
    }).then((reply) => {
      debug('index', 'reply:', reply.length);
      return resolve(reply);
    }).catch(err => {
      if (err === 401) {
        return reject(401);
      }
      debug(err);
      reject(err);
    });
  });

};

exports.find = function (query, headers, params, resourceName) {
  let resource = checkResource(params, resourceName);
  let id = params.id;

  return new Promise(function (resolve, reject) {
    DS.find(resource, id, {
      headers: _.pick(headers, config.headers),
      //findStrategy: 'fallback',
      //findFallbackAdapters: ['redis', 'http'],
      qs: query,
      bypassCache: false,
      cacheResponse: true
    }).then(reply => {
      if (reply === 401) {
        return reject(401);
      }
      return resolve(reply);
    }).catch(err => {
      debug(err);
      reject(err);
    });
  });
};
