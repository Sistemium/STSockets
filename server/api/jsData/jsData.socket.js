'use strict';

let debug = require('debug')('sts:jsData:socket');
let _ = require('lodash');
let uuid = require('node-uuid');
let router = require ('./jsData.socket.router');

var subscriptions = [];

function emitEvent (method, resource, sourceSocketId) {

  debug('emitEvent:', method, resource);

  return (data) => {
    _.each(subscriptions, function (subscription) {

      if (_.includes(subscription.filter, resource)) {

        let event = 'jsData:' + method;
        let socket = subscription.socket;

        if (socket.id !== sourceSocketId) {
          debug('emitEvent:', event, 'id:', socket.id);
          socket.emit(event, {
            resource: resource,
            data: _.pick(data, 'id')
          });
        }

      }

    });
  };

}

exports.emitEvent = emitEvent;

function unRegister (socket) {

  let toUnsubscribe = _.filter(subscriptions, {socket: socket});

  debug('unRegister:', socket.id, 'subscriptions:', toUnsubscribe.length);

  _.each(toUnsubscribe, subscription => {
    _.remove(subscriptions, subscription);
  });

}


exports.register = function (socket) {

  socket.on('jsData:subscribe', function (filter, callback) {

    var subscription = {
      id: uuid.v4(),
      socket: socket,
      filter: filter
    };

    debug('jsData:subscribe', subscription.id, 'socket:', socket.id, 'filter:', filter);

    subscriptions.push(subscription);

    if (_.isFunction(callback)) {
      callback({data:subscription.id});
    }

  });

  socket.on('jsData:unsubscribe', function (id, callback) {

    var idx = _.findIndex (subscriptions, {id: id});

    if (idx>=0) {
      var subscription = subscriptions [idx];
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'filter:', subscription.filter);
      subscriptions.splice(idx,1);
    } else {
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'no subscription');
    }

    if (_.isFunction(callback)) {
      callback(subscription.id);
    }

  });

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('jsData', function (data, callback) {

    data.options = data.options || {};
    _.defaultsDeep(data.options, {
      headers: {
        authorization: socket.accessToken,
        'x-return-post': true
      },
      sourceSocketId: socket.id
    });

    //debug('jsData event', data);

    router (data, callback);

  });

};
