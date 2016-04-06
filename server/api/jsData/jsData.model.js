'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.controller');
let config = require('../../config/environment');
let makeRequest = require('./makeRequest');

function getResourceName(urlParams, resource) {
  let resourceName = urlParams && urlParams.pool + '/' + urlParams.resource;
  resourceName = resourceName ? resourceName
    : resource && resource.name;
  return resourceName;
}

exports.findAll = function (req, resource, params, options) {
  let urlParams = req.params;
  let query = req.query || params;
  let headers = _.pick(req.headers || options.headers, config.headers);

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
  let urlParams = req.params;
  let headers = _.pick(req.headers || options.headers, config.headers);
  id = urlParams.id || id;

  let resourceName = getResourceName(urlParams, resource);

  return new Promise(function (resolve, reject) {
    let opts = {
      url: config.STAPI + resourceName + '/' + id,
      method: 'GET',
      headers: headers
    };

    makeRequest(opts, resolve, reject);
  });
};
