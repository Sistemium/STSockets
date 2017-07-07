'use strict';

const debug = require('debug')('sts:jsData:socket');

import _ from 'lodash';
import uuid  from 'node-uuid';
import router from './jsData.socket.router';
const jsDataModel = require('./jsData.model');

const subscriptions = [];


export {emitEvent, subscribe, unSubscribe, register};


function emitEvent(method, resource, sourceSocketId) {

  debug('emitEvent:', method, resource);

  return (data) => {
    _.each(subscriptions, function (subscription) {

      if (_.includes(subscription.filter, resource)) {

        authorizedForData(subscription,method,data,resource).then(() => {

          let event = 'jsData:' + method;
          let socket = subscription.socket;

          if (socket.id !== sourceSocketId) {
            debug('emitEvent:', event, 'id:', socket.id);
            socket.emit(event, {
              resource: resource,
              data: _.pick(data, ['id', 'objectXid', 'ts'])
            });
          }

        }).catch(_.noop);

      }

    });

  };

}

function authorizedForData(subscription,method,data,resource) {

  return new Promise(function (resolve, reject) {

    let id = data.id;

    if (_.isEqual(method,'update') && id){

      let socket = subscription.socket;

      let options = {
        headers: {
          authorization: socket.accessToken,
          'x-return-post': true,
          'user-agent': socket.userAgent
        },
        sourceSocketId: socket.id,
        authId: _.get(socket, 'account.authId')
      };

      return jsDataModel.find(resource,id, options).then(resolve).catch(reject);

    }

    return resolve();

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
