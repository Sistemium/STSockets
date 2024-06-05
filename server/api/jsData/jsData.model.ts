import log from 'sistemium-debug';
import _ from 'lodash';
// @ts-ignore
import LRU from 'lru-cache';
import config from '../../config/environment';
import makeRequest from './makeRequest';
import * as redis from '../../config/redis';
import { emitEvent } from './jsData.socket';

const { debug } = log('jsData.model');

const lruOptions = {
  max: process.env.JSD_LRU_MAX || 100,
  maxAge: process.env.JSD_LRU_MAX_AGE || (1000 * 30)
};

const findRequests = LRU(lruOptions);

export function findAll(resource: string, params: Record<string, any>, options: Record<string, any>) {

  let headers = _.pick(options.headers, config.headers);

  return new Promise(function (resolve, reject) {

    const opts = {
      qs: params,
      url: config.apiV4(resource),
      method: 'GET',
      headers: headers
    };

    //debug('findAll:opts', opts);

    makeRequest(opts, (fromBackend: any) => {
      //debug('fromBackend', fromBackend);
      resolve(fromBackend);
    }, reject);

  });

}

export function find(resource: string, id: string, options: Record<string, any>) {

  const headers = _.pick(options.headers, config.headers);

  return new Promise((resolve, reject) => {

    const hash = config.apiV4(resource);

    const opts = {
      url: hash + '/' + id,
      method: 'GET',
      headers: headers
    };

    const expireRedisAfter = config.redis.expireAfter;

    if (!headers.authorization) {
      // 'Authorization required'
      return reject(401);
    }

    if (!id) {
      //'Find requires id',
      return reject(400);
    }

    const authorizedHash = `${options.authId || headers.authorization}#${hash}`;
    const hashId = hash + '#' + id;
    const minUts = Date.now() - expireRedisAfter;

    redis.hgetAsync(authorizedHash, id)
      .then((authData: any) => {

        if (authData && authData.uts > minUts) {

          return redis.hgetAsync(hash, id)
            .then(gotFromRedisOrBackend)
            .catch((err: any) => {

              console.error('jsData:find:redis:error', err);
              debug('find:makeRequest', opts);

              makeRequest(opts, (fromBackend: any) => {
                resolve(fromBackend.data);
              }, reject);

            });

        }

        return getFromBackend();

      })
      .catch(getFromBackend);

    function getFromBackend() {

      // TODO: check if possible to use pending by unauthorized hash
      const authorizedHashId = `${authorizedHash}#${id}`;
      let pending = findRequests.get(authorizedHashId);

      if (!pending) {

        pending = new Promise((resolvePending, rejectPending) => {

          makeRequest(opts, onSuccess, rejectPending);

          function onSuccess(fromBackend: any) {

            if (fromBackend && fromBackend.data) {

              if (fromBackend.noCache) {
                return resolvePending(fromBackend.data);
              }

              const authData = {
                eTag: fromBackend.eTag,
                uts: Date.now()
              };

              redis.hsetAsync(authorizedHash, id, authData)
                .then((reply: any) => {
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
        debug('find:makeRequest', options.sourceSocketId, opts.method, opts.url);

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

    function gotFromRedisOrBackend(inRedis: any) {

      if (inRedis && inRedis.data && inRedis.uts > minUts) {
        debug('find:redis', `${hashId} (${inRedis.uts})`);
        return resolve(inRedis.data);
      }

      getFromBackend();

    }

  });
}

export function createOrUpdate(method: string, options: Record<string, any>) {

  const headers = _.pick(options.headers, config.headers);

  return new Promise((resolve, reject) => {

    let url = config.apiV4(options.resource);
    const hash = url;
    url += options.id ? '/' + options.id : '';

    const opts = {
      url: url,
      method: method,
      headers: headers,
      json: options.attrs,
      qs: options.qs
    };

    let id = options.id || _.get(options, 'attrs.id');

    makeRequest(opts, (fromBackend: any) => {

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

      const { objectXid, name, isRemoved } = fromBackend.data;

      // debug('objectXid', objectXid, name, options.resource);

      if (objectXid && /.*\/RecordStatus$/i.test(options.resource) && isRemoved) {

        const org = _.first(options.resource.match(/[^\/]+\//)) || '';
        const resource = org + name;
        return destroy(resource, objectXid, options.options)
          .then(() => resolve(fromBackend.data))
          .catch(() => {

            resolve(fromBackend.data);

            if (/^(Partner|Outlet)$/.test(options.resource)) {
              return;
            }

            emitEvent('destroy', resource, options.sourceSocketId)({ id: objectXid });

          });
      }

      resolve(fromBackend.data);
      //sockets.emitEvent('update',options.resource, _.get(options,'options.sourceSocketId'))(fromBackend.data);

    }, reject);

  });

}

export function create(resource: string, attrs: any, options: any) {

  return createOrUpdate('POST', {
    resource: resource,
    attrs: attrs,
    options: options,
    headers: options.headers
  })

}

export function update(resource: string, id: string, attrs: any, options: any) {

  return createOrUpdate('PUT', {
    resource: resource,
    id: id,
    attrs: attrs,
    options: options,
    headers: options.headers
  });

}

export function destroy(resource: string, id: string, options: any) {

  return new Promise((resolve, reject) => {

    if (!id) {
      return reject('id is required');
    }

    const hash = config.apiV4(resource);
    const url = hash + '/' + id;
    const opts = {
      url: url,
      method: 'DELETE',
      headers: _.pick(options.headers, config.headers),
      qs: options.qs
    };

    redis.hdelAsync(hash, id);

    makeRequest(opts, () => {
      emitEvent('destroy', resource, options.sourceSocketId)({ id });
      resolve(null);
    }, reject);

  });

}
