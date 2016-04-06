'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.controller');
let config = require('../../config/environment');
let makeRequest = require('./makeRequest');
let redis = require ('../../config/redis');

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

    debug ('findAll:opts', opts);

    makeRequest(opts, resolve, reject);
  });

};

exports.find = function (req, resource, id, options) {
  let urlParams = req && req.params;
  let headers = _.pick(req && req.headers || options.headers, config.headers);
  id = urlParams && urlParams.id || id;

  let resourceName = getResourceName(urlParams, resource);

  return new Promise(function (resolve, reject) {
    let hash = config.STAPI + resourceName;
    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };
    
    redis.hgetAsync(hash, id)
      .then((data) => {
        if (data) {
          debug ('find:redis', `${hash}#${id}`);
          resolve (data);
        } else {
          debug ('find:makeRequest', opts);
          makeRequest (opts, (resolved) => {
            redis.hsetAsync(hash,id,resolved);
            resolve(resolved);
          }, reject);
        }
      })
      .catch((err)=>{
        console.error ('jsData:find:redis:error', err);
        debug ('find:makeRequest', opts);
        makeRequest (opts, resolve, reject);
      });

  });
};
