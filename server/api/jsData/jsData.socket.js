'use strict';

const debug = require('debug')('sts:jsData:socket');

import _ from 'lodash';
import uuid  from 'node-uuid';
import router from './jsData.socket.router';
const jsDataModel = require('./jsData.model');
const config = require('../../config/environment');
const when = require('when');

const {globalToken} = config;

const subscriptions = [];


export {emitEvent, subscribe, unSubscribe, register};


function emitEvent(method, resource, sourceSocketId) {

  debug('emitEvent:', method, resource);

  return data => {

    let pool = _.head(resource.split('/'));

    let accessToken = globalToken(pool);

    if (!accessToken) {
      return emitToSubscribers(method, resource, sourceSocketId)(data);
    }

    let adminSocket = {accessToken};

    authorizedForData(data, adminSocket, method, resource)
      .then(emitToSubscribers(method, resource, sourceSocketId))
      .catch(err => {
        console.error(err);
      });

  };

}

function emitToSubscribers(method, resource, sourceSocketId) {

  return data => {
    _.each(subscriptions, subscription => {

      if (!_.includes(subscription.filter, resource)) {
        return;
      }

      let pluginAuthorization = _.get(subscription, `socket.jsDataAuth.${resource}`);

      if (pluginAuthorization) {

        when(pluginAuthorization(subscription, method, data, resource))
          .then(authorized => {

            // debug('pluginAuthorization', subscription.socket.userId, method, resource, authorized);

            if (authorized === true) {
              return emitToSocket(subscription.socket, method, resource, sourceSocketId)(data);
            }

            if (authorized === false) {
              return;
            }

            authorizedForData(data, subscription.socket, method, resource)
              .then(emitToSocket(subscription.socket, method, resource, sourceSocketId))
              .catch(_.noop);

          });

      } else {

        authorizedForData(data, subscription.socket, method, resource)
          .then(emitToSocket(subscription.socket, method, resource, sourceSocketId))
          .catch(_.noop);

      }

    });
  }

}

function emitToSocket(socket, method, resource, sourceSocketId) {

  return data => {
    let event = 'jsData:' + method;

    if (socket.id !== sourceSocketId) {
      debug('emitEvent:', event, 'id:', socket.id);
      socket.emit(event, {
        resource: resource,
        data: data
      });
    }
  }

}

function authorizedForData(data, socket, method, resource) {

  return new Promise(function (resolve, reject) {

    let id = data.id;

    if (_.isEqual(method, 'update') && id) {

      let options = {
        headers: {
          authorization: socket.accessToken,
          'x-return-post': true,
          'user-agent': socket.userAgent || 'STSockets'
        },
        sourceSocketId: socket.id,
        authId: _.get(socket, 'account.authId')
      };

      return jsDataModel.find(resource, id, options)
        .then(resolve)
        .catch(reject);

    }

    return resolve(data);

  });

}

function unRegister(socket) {

  let toUnsubscribe = _.filter(subscriptions, {socket: socket});

  debug('unRegister:', socket.id, 'subscriptions:', toUnsubscribe.length);

  _.each(toUnsubscribe, subscription => {
    _.remove(subscriptions, subscription);
  });

}

function subscribe(socket) {

  return function (filter, callback) {

    let subscription = {
      id: uuid.v4(),
      socket: socket,
      filter: filter
    };

    debug('jsData:subscribe', subscription.id, 'socket:', socket.id, 'filter:', filter);

    subscriptions.push(subscription);

    let result = {data: subscription.id};

    if (_.isFunction(callback)) return callback(result);

    return result;

  };

}

function unSubscribe(socket) {
  return function (id, callback) {

    let idx = _.findIndex(subscriptions, {id: id});
    let subscription;

    if (idx >= 0) {
      subscription = subscriptions [idx];
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'filter:', subscription.filter);
      subscriptions.splice(idx, 1);
    } else {
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'no subscription');
    }

    if (_.isFunction(callback)) {
      callback(subscription && subscription.id);
    }

  };
}


function register(socket) {

  socket.on('jsData:subscribe', subscribe(socket));

  socket.on('jsData:unsubscribe', unSubscribe(socket));

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('jsData', function (data, callback) {

    data.options = data.options || {};

    _.defaultsDeep(data.options, {
      headers: {
        authorization: socket.accessToken,
        'x-return-post': true,
        'user-agent': socket.userAgent
      },
      sourceSocketId: socket.id,
      authId: _.get(socket, 'account.authId')
    });

    if (socket.deviceUUID) {
      data.options.headers.deviceuuid = socket.deviceUUID;
      if (data.attrs) {
        data.attrs.deviceUUID = socket.deviceUUID;
      }
    }

    //debug('jsData event', data);

    router(data, callback);

  });

}
