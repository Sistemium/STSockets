'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:msg');
let redis = require('../../config/redis');
let config = require('../../config/environment');
let socket = require('../jsData/jsData.socket');
let async = require('async');

function processObject (msg) {
  return redis.hdelAsync (config.APIv4 + msg.resource, msg.resourceId)
    .then((res) => {
      debug ('hdelAsync', config.APIv4 + msg.resource, msg.resourceId, res);
      return res;
    });
}

exports.create = function (req,res,next) {

  var msg = req.body||{};
  _.assign (msg,req.query);

  //debug ('create', msg);

  processObject(msg)
    .then(()=>{
      res.sendStatus(201);
      socket.emitEvent ('update', msg.resource) ({id: msg.resourceId});
    })
    .catch(next);

};

exports.post = function (req,res,next) {

  var data = req.body || [];

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
