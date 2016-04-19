'use strict';

let _ = require('lodash');
let debug = require('debug')('sts:jsData.model');
let config = require('../../config/environment');
let makeRequest = require('./makeRequest');
let redis = require('../../config/redis');
let sockets = require('./jsData.socket');


let LRU = require('lru-cache');
let lruOptions = {
  max: process.env.JSD_LRU_MAX || 100,
  maxAge: process.env.JSD_LRU_MAX_AGE || (1000 * 30)
};

let findRequests = LRU(lruOptions);


exports.findAll = function (resource, params, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let opts = {
      qs: params,
      url: config.APIv4 + resource,
      method: 'GET',
      headers: headers
    };

    //debug('findAll:opts', opts);

    makeRequest(opts, fromBackend => {
      //debug('fromBackend', fromBackend);
      resolve(fromBackend.data);
    }, reject);
  });

};

exports.find = function (resource, id, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let hash = config.APIv4 + resource;
    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };
    let expireRedisAfter = config.redis.expireAfter;

    let authorizedHash = headers.authorization + '#' + hash;
    redis.hgetAsync(authorizedHash, id).then(inRedis => {
        return redis.hgetAsync(hash, id)
          .then((inRedis) => {
            let hashId = hash + '#' + id;

            if (inRedis && inRedis.data) {

              debug('find:redis', `${hashId} (${inRedis.uts})`);
              resolve(inRedis.data);

            } else {

              let pending = findRequests.get(hashId);

              if (!pending) {
                pending = new Promise((resolveQ, rejectQ) => {

                  function onSuccess(fromBackend) {
                    if (fromBackend && fromBackend.data && fromBackend.status !== 500) {
                      redis.hsetAsync(authorizedHash, id, fromBackend.eTag).then(function (reply) {

                        debug('hsetAsync:redis', reply);

                        redis.redisClient.expire(authorizedHash, expireRedisAfter);

                      });
                      redis.hsetAsync(hash, id, fromBackend).then(() => {
                        redis.redisClient.expire(hash, expireRedisAfter);
                      });
                      resolveQ(fromBackend.data);
                    } else {
                      rejectQ({
                        error: 'Invalid backend response',
                        response: fromBackend
                      });
                    }
                  }

                  makeRequest(opts, onSuccess, rejectQ);

                });

                findRequests.set(hashId, pending);
                debug('find:makeRequest', opts);

                pending.then(()=> {
                  findRequests.del(hashId);
                  //debug('delete:pending:then');
                }, ()=> {
                  findRequests.del(hashId);
                  //debug('delete:pending:catch');
                });

              }

              pending.then(resolve, reject);

            }
          })
          .catch((err)=> {
            console.error('jsData:find:redis:error', err);
            debug('find:makeRequest', opts);
            makeRequest(opts, (fromBackend) => {
              resolve(fromBackend.data);
            }, reject);
          });
      })
      .catch((err)=> {
        console.error('jsData:find:redis:error', err);
        debug('find:makeRequest', opts);
        makeRequest(opts, (fromBackend) => {
          resolve(fromBackend.data);
        }, reject);
      });

  });
};

function createOrUpdate(method, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let url = config.APIv4 + options.resource;
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
        //sockets.emitEvent('update',options.resource, _.get(options,'options.sourceSocketId'))(fromBackend.data);
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
    let url = config.APIv4 + resource + '/' + id;
    let opts = {
      url: url,
      method: 'DELETE',
      headers: _.pick(options.headers, config.headers),
      qs: options.qs
    };
    makeRequest(opts, () => {
      sockets.emitEvent('destroy', resource, options.sourceSocketId)({
        id: id
      });
      resolve();
    }, reject);
  });
};
