import _ from 'lodash';
import LRU from 'lru-cache';

import config from '../../config/environment';
import makeRequest from './makeRequest';
import redis from '../../config/redis';
import {emitEvent} from './jsData.socket';

const debug = require('debug')('sts:jsData.model');

const lruOptions = {
  max: process.env.JSD_LRU_MAX || 100,
  maxAge: process.env.JSD_LRU_MAX_AGE || (1000 * 30)
};

const findRequests = LRU(lruOptions);

export {findAll, find, create, update, destroy};


function findAll(resource, params, options) {

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

}

function find(resource, id, options) {

  let headers = _.pick(options.headers, config.headers);

  return new Promise((resolve, reject) => {

    let hash = config.apiV4(resource);

    let opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };

    let expireRedisAfter = config.redis.expireAfter;

    if (!headers.authorization) {
      // 'Authorization required'
      return reject(401);
    }

    if (!id) {
      //'Find requires id',
      return reject(400);
    }

    let authorizedHash = `${options.authId || headers.authorization}#${hash}`;
    let hashId = hash + '#' + id;
    let minUts = Date.now() - expireRedisAfter;

    redis.hgetAsync(authorizedHash, id)
      .then(authData => {

        if (authData && authData.uts > minUts) {

          return redis.hgetAsync(hash, id)
            .then(gotFromRedisOrBackend)
            .catch((err) => {

              console.error('jsData:find:redis:error', err);
              debug('find:makeRequest', opts);

              makeRequest(opts, fromBackend => {
                resolve(fromBackend.data);
              }, reject);

            });

        }

        return getFromBackend();

      })
      .catch(reject);

    function getFromBackend() {

      // TODO: check if possible to use pending by unauthorized hash
      let authorizedHashId = `${authorizedHash}#${id}`;
      let pending = findRequests.get(authorizedHashId);

      if (!pending) {

        pending = new Promise((resolvePending, rejectPending) => {

          makeRequest(opts, onSuccess, rejectPending);

          function onSuccess(fromBackend) {

            if (fromBackend && fromBackend.data) {

              let authData = {
                eTag: fromBackend.eTag,
                uts: Date.now()
              };

              redis.hsetAsync(authorizedHash, id, authData)
                .then(reply => {
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
        return resolve(inRedis.data);
      }

      getFromBackend();

    }

  });
}

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

    makeRequest(opts, fromBackend => {

      if (!fromBackend || !fromBackend.data) {
        return reject({
          error: 'Invalid backend response',
          response: fromBackend
        });
      }

      fromBackend.uts = Date.now();

      if (id) {
        redis.hdelAsync(hash, id);
      }

      let {objectXid, name, isRemoved} = fromBackend.data;

      // debug('objectXid', objectXid, name, options.resource);

      if (objectXid && /.*\/RecordStatus$/i.test(options.resource) && isRemoved) {
        let org = _.first(options.resource.match(/[^\/]+\//)) || '';
        let resource = org + name;
        return destroy(resource, objectXid, options.options)
          .then(() => resolve(fromBackend.data))
          .catch(() => {

            resolve(fromBackend.data);

            emitEvent('destroy', resource, options.sourceSocketId)({id: objectXid});

          });
      }

      resolve(fromBackend.data);
      //sockets.emitEvent('update',options.resource, _.get(options,'options.sourceSocketId'))(fromBackend.data);

    }, reject);

  });

}

function create(resource, attrs, options) {

  return createOrUpdate('POST', {
    resource: resource,
    attrs: attrs,
    options: options,
    headers: options.headers
  })

}

function update(resource, id, attrs, options) {

  return createOrUpdate('PUT', {
    resource: resource,
    id: id,
    attrs: attrs,
    options: options,
    headers: options.headers
  });

}

function destroy(resource, id, options) {

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

    redis.hdelAsync(hash, id);

    makeRequest(opts, () => {
      emitEvent('destroy', resource, options.sourceSocketId)({id});
      resolve();
    }, reject);

  });

}
