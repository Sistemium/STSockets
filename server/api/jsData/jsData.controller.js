'use strict';

let JSData = require('js-data');
let DSRedisAdapter = require('js-data-redis');
let config = require('../../config/environment');
let _ = require('lodash');
let DS = new JSData.DS({
  cacheResponse: false,
  bypassCache: true,
  keepChangeHistory: false,
  resetHistoryOnInject: false,
  upsert: false,
  notify: false,
  log: false
});
let debug = require('debug')('sts:jsData.controller');

let DSHttpAdapter = require('../../jsDataAdapters/httpAdapter');
let httpAdapter = new DSHttpAdapter({
  url: config.STAPI
});

let redisAdapter = new DSRedisAdapter();

DS.registerAdapter('http', httpAdapter, {default: true});
//DS.registerAdapter('redis', redisAdapter);

function checkResource(req) {
  let resource = req.params.pool + '/' + req.params.resource;
  //define resource if not already in store
  if (Object.keys(DS.definitions).indexOf(resource) === -1) {
    DS.defineResource(resource);
  }

  return resource;
}

exports.index = function (req, res, next) {

  let resource = checkResource(req);

  DS.findAll(resource, req.query || {}, {
    headers:  _.pick(req.headers, config.headers)
  }).then((reply) => {
    debug('index', 'reply:', reply.length);
    return res.json(reply);
  }).catch(err => {
    if (err === 401) {
      return res.status(401).end();
    }
    debug(err);
    next(err);
  });

};

exports.show = function (req, res, next) {

  let resource = checkResource(req);
  let id = req.params.id;

  DS.find(resource, id, {
    headers: _.pick(req.headers, config.headers),
    //findStrategy: 'fallback',
    //findFallbackAdapters: ['redis', 'http'],
    qs: req.query,
    bypassCache: false,
    cacheResponse: true
  }).then(reply => {
    if (reply === 401) {
      return res.status(401).end();
    }
    return res.json(reply);
  }).catch(err => {
    debug(err);
    next(err);
  });

};
