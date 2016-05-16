'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:msg');
let redis = require('../../config/redis');
let config = require('../../config/environment');
let socket = require('../jsData/jsData.socket');
let async = require('async');

function processObject (msg) {
  return redis.hdelAsync (config.apiV4(msg.resource), msg.resourceId)
    .then((res) => {
      debug ('hdelAsync', config.apiV4(msg.resource), msg.resourceId, res);
      return res;
    });
}

exports.create = function (req,res,next) {

  var msg = req.body;

  _.assign(msg, {
    resource: req.params.pool + '/' + req.params.resource
  });
  _.assign (msg,req.query);
  
  processObject(msg)
    .then(()=>{
      res.sendStatus(201);
      socket.emitEvent ('update', msg.resource) ({id: msg.resourceId});
    })
    .catch(next);

};

exports.post = function (req,res,next) {

  var data = req.body || req.query || [];

  if (!_.isArray(data)) {
    data = [data];
  }

  //debug ('post', data);

  async.eachSeries(data, (msg,done) => {
    processObject(msg)
      .then((res) => {
        done();
        return res;
      })
      .catch(done);
  }, (err) => {
    if (err) {
      return next (err);
    }
    res.sendStatus(201);
    _.each (data, (msg) => {
      socket.emitEvent ('update', msg.resource) ({id: msg.resourceId});
    })
  });

};

exports.delete = function (req,res,next) {

  var hash = config.apiV4(req.params.pool + '/' + req.params.resource);

  redis.delAsync (hash)
    .then((res) => {
      debug ('delAsync:success', hash, res);
      return res;
    })
    .catch((res)=>{
      debug ('delAsync:error', hash, res);
    });

  res.sendStatus(200);

};
