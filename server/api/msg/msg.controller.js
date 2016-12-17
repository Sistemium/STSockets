'use strict';

const _ = require('lodash');
const debug = require('debug')('sts:msg');
const redis = require('../../config/redis');
const config = require('../../config/environment');
const socket = require('../jsData/jsData.socket');
const async = require('async');

function processObject(msg) {
  return redis.hdelAsync(config.apiV4(msg.resource), msg.resourceId)
    .then((res) => {
      debug('hdelAsync', config.apiV4(msg.resource), msg.resourceId, res);
      return res;
    });
}

exports.create = function (req, res, next) {

  let msg = req.body;

  _.assign(msg, {
    resource: req.params.pool + '/' + req.params.resource
  });
  _.assign(msg, req.query);

  processObject(msg)
    .then(() => {
      res.sendStatus(201);
      socket.emitEvent('update', msg.resource)({id: msg.resourceId});
    })
    .catch(next);

};

exports.post = function (req, res, next) {

  let data = req.body || req.query || [];

  if (!_.isArray(data)) {
    data = [data];
  }

  //debug ('post', data);

  async.eachSeries(data, (msg, done) => {
    processObject(msg)
      .then((res) => {
        done();
        return res;
      })
      .catch(done);
  }, (err) => {
    if (err) {
      return next(err);
    }
    res.sendStatus(201);
    _.each(data, (msg) => {
      socket.emitEvent('update', msg.resource)({id: msg.resourceId});
    })
  });

};

exports.delete = function (req, res) {

  let hash = config.apiV4(req.params.pool + '/' + req.params.resource);

  redis.delAsync(hash)
    .then((res) => {
      debug('delAsync:success', hash, res);
      return res;
    })
    .catch((res) => {
      debug('delAsync:error', hash, res);
    });

  res.sendStatus(200);

};
