'use strict';

const _ = require('lodash');
const LRU = require('lru-cache');
const debug = require('debug')('sts:jsData.model');

const config = require('../../config/environment');
const makeRequest = require('./makeRequest');
const redis = require('../../config/redis');
const sockets = require('./jsData.socket');


const lruOptions = {
  max: process.env.JSD_LRU_MAX || 100,
  maxAge: process.env.JSD_LRU_MAX_AGE || (1000 * 30)
};

const findRequests = LRU(lruOptions);


exports.findAll = function (resource, params, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let opts = {
      qs: params,
      url: config.apiV4(resource),
      method: 'GET',
      headers: headers
    };

    //debug('findAll:opts', opts);

    makeRequest(opts, fromBackend => {
      //debug('fromBackend', fromBackend);
      resolve(fromBackend);
    }, reject);
  });

};

exports.find = function (resource, id, options) {
  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {
    let hash = config.apiV4(resource);
    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };
    let expireRedisAfter = config.redis.expireAfter;

    if (!headers.authorization) {
      reject(
        // 'Authorization required'
        401
      );
    }

    if (!id) {
      reject(
        //'Find requires id',
        400
      );
    }

    let authorizedHash = `${options.authId || headers.authorization}#${hash}`;
    let hashId = hash + '#' + id;
    let minUts = Date.now() - expireRedisAfter;

    function getFromBackend() {

      // TODO: check if possible to use pending by unauthorized hash
      let authorizedHashId = `${authorizedHash}#${id}`;
      let pending = findRequests.get(authorizedHashId);

      if (!pending) {

        pending = new Promise((resolvePending, rejectPending) => {

          function onSuccess(fromBackend) {
            if (fromBackend && fromBackend.data) {
              let authData = {
                eTag: fromBackend.eTag,
                uts: Date.now()
              };

              redis.hsetAsync(authorizedHash, id, authData).then(function (reply) {
                debug('hsetAsync:authorizedHash', reply, authorizedHash, id, fromBackend.eTag);
                redis.redisClient.expire(authorizedHash, expireRedisAfter);
              });

              fromBackend.uts = Date.now();
              redis.hsetAsync(hash, id, fromBackend);

              resolvePending(fromBackend.data);

            } else {

              rejectPending({
                error: 'Invalid backend response',
                response: fromBackend,
                status: fromBackend.status
              });

            }
          }

          makeRequest(opts, onSuccess, rejectPending);

        });

        findRequests.set(authorizedHashId, pending);
        debug('find:makeRequest', opts);

        pending.then(() => {
          findRequests.del(authorizedHashId);
          //debug('delete:pending:then');
        }, () => {
          findRequests.del(authorizedHashId);
          //debug('delete:pending:catch');
        });

      }

      pending.then(resolve, reject);

    }

    function gotFromRedisOrBackend(inRedis) {
      if (inRedis && inRedis.data && inRedis.uts > minUts) {
        debug('find:redis', `${hashId} (${inRedis.uts})`);
        resolve(inRedis.data);
      } else {
        getFromBackend();
      }
    }

    redis.hgetAsync(authorizedHash, id).then((authData) => {

      if (authData && authData.uts > expireRedisAfter) {
        return redis.hgetAsync(hash, id)
          .then(gotFromRedisOrBackend)
          .catch((err) => {
            console.error('jsData:find:redis:error', err);
            debug('find:makeRequest', opts);
            makeRequest(opts, (fromBackend) => {
              resolve(fromBackend.data);
            }, reject);
          });
      } else {
        return getFromBackend();
      }

    });

  });
};

function createOrUpdate(method, options) {

  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {

    let url = config.apiV4(options.resource);
    let hash = url;
    url += options.id ? '/' + options.id : '';

    let opts = {
      url: url,
      method: method,
      headers: headers,
      json: options.attrs,
      qs: options.qs
    };

    let id = options.id || _.get(options, 'attrs.id');

    makeRequest(opts, (fromBackend) => {
      if (fromBackend && fromBackend.data) {

        fromBackend.uts = Date.now();

        if (id) {
          redis.hdelAsync(hash, id);
        }

        let objectXid = fromBackend.data.objectXid;
        let name = fromBackend.data.name;

        // debug('objectXid', objectXid, name, options.resource);

        if (objectXid && /.*\/RecordStatus$/i.test(options.resource)) {
          let org = options.resource.match(/[^\/]+\//)[0]||'';
          sockets.emitEvent('destroy', org + name, options.sourceSocketId)({
            id: objectXid
          });
        }

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

    if (!id) {
      return reject('id is required');
    }

    let hash = config.apiV4(resource);
    let url = hash + '/' + id;
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
      redis.hdelAsync(hash, id);
      resolve();
    }, reject);

  });
};
