'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.model');
let config = require('../../config/environment');
let makeRequest = require('./makeRequest');
let redis = require('../../config/redis');

exports.findAll = function (resource, params, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let opts = {
      qs: params,
      url: config.STAPI + resource,
      method: 'GET',
      headers: headers
    };

    debug('findAll:opts', opts);

    makeRequest(opts, fromBackend => {
      //debug('fromBackend', fromBackend);
      resolve(fromBackend.data);
    }, reject);
  });

};

exports.find = function (resource, id, options) {
  let headers = _.pick(options.headers, config.headers);

  // TODO: get expire time from config by resource name
  let expireRedisAfter = 120000;

  return new Promise(function (resolve, reject) {
    let hash = config.STAPI + resource;
    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };
    let minUts = Date.now() - expireRedisAfter;

    redis.hgetAsync(hash, id)
      .then((inRedis) => {

        if (inRedis && inRedis.data && inRedis.uts > minUts) {

          debug('find:redis', `${hash}#${id} (${inRedis.uts})`);
          resolve(inRedis.data);

        } else {

          debug('find:makeRequest', opts);

          makeRequest(opts, (fromBackend) => {
            if (fromBackend && fromBackend.data) {
              fromBackend.uts = Date.now();
              redis.hsetAsync(hash, id, fromBackend);
              resolve(fromBackend.data);
            } else {
              reject({
                error: 'Invalid backend response',
                response: fromBackend
              });
            }
          }, reject);

        }

      })
      .catch((err)=> {
        console.error('jsData:find:redis:error', err);
        debug('find:makeRequest', opts);
        makeRequest(opts, resolve, reject);
      });

  });
};

function createOrUpdate(method, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let url = config.STAPI + options.resource;
    url += options.id ? '/' + options.id : '';
    let opts = {
      url: url,
      method: method,
      headers: headers,
      json: options.attrs,
      qs: options.qs
    };
    makeRequest(opts, (fromBackend) => {
      if (fromBackend && fromBackend.data) {
        fromBackend.uts = Date.now();
        //debug('fromBackend', fromBackend);
        resolve(fromBackend.data);
      } else {
        reject({
          error: 'Invalid backend response',
          response: fromBackend
        });
      }
    }, reject);
  });
}

exports.create = function (resource, attrs, options) {

  return createOrUpdate('POST', {
    resource: resource,
    attrs: attrs,
    options: options,
    headers: options.headers
  })

};

exports.update = function (resource, id, attrs, options) {

  return createOrUpdate('PUT', {
    resource: resource,
    id: id,
    attrs: attrs,
    options: options,
    headers: options.headers
  });

};

exports.destroy = function (resource, id, options) {

  return new Promise(function (resolve, reject) {
    let url = config.STAPI + resource + '/' + id;
    let opts = {
      url: url,
      method: 'DELETE',
      headers: _.pick(options.headers, config.headers),
      qs: options.qs
    };
    makeRequest(opts, () => resolve(), reject);
  });
};
