'use strict';

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

let DSHttpAdapter = require('../../jsDataAdapters/httpAdapter');
let httpAdapter = new DSHttpAdapter({
  url: 'http://localhost:9000/api/'
});

DS.registerAdapter('http', httpAdapter, {default: true});

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

  DS.findAll(resource, {}, {
    headers: {
      authorization: req.headers.authorization
    },
    qs: req.query
  }).then((reply) => {
    return res.json(reply);
  }).catch(err => {
    console.error(err);
    next(err);
  });

};

exports.show = function (req, res, next) {

  let resource = checkResource(req);
  let id = req.params.id;

  DS.find(resource, id, {
    headers: {
      authorization: req.headers.authorization
    },
    qs: req.query,
    bypassCache: false,
    cacheResponse: true
  }).then(reply => {
    return res.json(reply);
  }).catch(err => {
    console.error(err);
    next(err);
  });

};
