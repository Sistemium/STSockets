'use strict';

const _ = require('lodash');
const debug = require('debug')('sts:msg');
const redis = require('../../config/redis');
const config = require('../../config/environment');
const socket = require('../jsData/jsData.socket');
const async = require('async');

function processObject(msg) {

  if (!msg.resourceId) {
    let hash = config.apiV4(msg.resource);
    return redis.delAsync(hash)
      .then(res => {
        debug('delAsync:success', hash, res);
        return res;
      })
      .catch(res => debug('delAsync:error', hash, res));
  }

  return redis.hdelAsync(config.apiV4(msg.resource), msg.resourceId)
    .then(res => {
      debug('hdelAsync', config.apiV4(msg.resource), msg.resourceId, res);
      return res;
    })
    .catch(res => debug('delAsync:error', msg.resourceId, res));
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
      socket.emitEvent('update', msg.resource)({
        id: msg.resourceId,
        ts: msg.resourceTs
      });
      return null;
    })
    .catch(next);

};

exports.post = function (req, res, next) {

  let data = req.body || req.query || [];

  if (!_.isArray(data)) {
    data = [data];
  }

  async.eachSeries(data, (msg, done) => {

    processObject(msg)
      .then(res => {
        done();
        return res;
      })
      .catch(done);

  }, (err) => {

    if (err) return next(err);

    res.sendStatus(201);

    _.each(data, msg => {
      if (msg.resourceId) {
        socket.emitEvent('update', msg.resource)({
          id: msg.resourceId,
          ts: msg.resourceTs
        });
      } else {
        socket.emitEvent('updateCollection', msg.resource)({
          ts: msg.resourceTs
        });
      }
    });

  });

};

exports.delete = function (req, res) {

  let hash = config.apiV4(req.params.pool + '/' + req.params.resource);

  redis.delAsync(hash)
    .then(res => {
      debug('delAsync:success', hash, res);
      return res;
    })
    .catch(res => debug('delAsync:error', hash, res));

  res.sendStatus(200);

};
