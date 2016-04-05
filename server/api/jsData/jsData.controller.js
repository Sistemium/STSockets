'use strict';

let JSData = require('js-data');
let DSRedisAdapter = require('js-data-redis');
let DS = new JSData.DS({
  strategy: 'fallback',
  fallbackAdapters: ['http', 'redis'],
  cacheResponse: false,
  bypassCache: true,
  keepChangeHistory: false,
  resetHistoryOnInject: false,
  upsert: false,
  notify: false,
  log: false
});

let DSHttpAdapter = require('../../jsDataAdapters/httpAdapter');
let httpAdapter = new DSHttpAdapter({
  url: 'http://localhost:9000/api/'
});
let redisAdapter = new DSRedisAdapter();

DS.registerAdapter('redis', redisAdapter);
DS.registerAdapter('http', httpAdapter, {default: true});

function checkResource(req) {
  let resource = req.query.resource;
  //define resource if not already in store
  if (Object.keys(DS.definitions).indexOf(resource) === -1) {
    DS.defineResource(resource);
  }

  return resource;
}

exports.index = function (req, res) {

  let resource = checkResource(req);

  DS.findAll(resource).then((reply) => {
    return res.json(reply);
  }).catch(err => {
    console.error(err);
  });

};

exports.show = function (req, res) {

  let resource = checkResource(req);
  let id = req.params.id;

  DS.find(resource, id).then(reply => {
    return res.json(reply);
  }).catch(err => {
    console.error(err);
  });

};
