'use strict';
let jsDataModel = require('./jsData.model');
let debug = require('debug')('sockets:jsData.socket');
let _ = require('lodash');
var registeredSockets = [];

function handleSuccess(callback) {
  return reply => {
    callback({data: reply || []});
    return reply;
  }
}

function handleError(callback) {
  return err => {
    debug('error occurred', err);
    callback({error: err})
  };
}

function unRegister(socket) {
  var idx = _.findIndex(registeredSockets, {socket: socket});
  if (idx) {
    registeredSockets.splice(idx, 1);
    debug('Registered sockets', registeredSockets.length);
  }
}

function emitEvent(method, resource) {

  return (reply) => {
    _.each(registeredSockets, function (socketData) {
      //todo check if subscribed on entity
      //if (_.includes(socketData.entities, resource)) {
      // name of entity hardcoded for now
        let event = 'jsData:' + method + ':' + 'article';
        debug('event emitted', event);
        socketData.socket.emit(event, reply);
      //}
    });
  }

}

exports.register = function (socket) {

  socket.on('jsData:subscribe', function (entities) {
    debug('subscribe for jsData');

    registeredSockets.push({
      socket: socket,
      entities: entities
    });
  });

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('jsData', function (data, callback) {

    data.options = data.options || {};
    _.assign(data.options, {
      headers: {
        authorization: socket.accessToken,
        'x-return-post': true
      }
    });
    debug('jsData event', data);

    switch (data.method) {

      case 'findAll' :
      {
        jsDataModel.findAll(data.resource, data.params, data.options)
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'find':
      {
        jsDataModel.find(data.resource, data.id, data.options)
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'create':
      {
        jsDataModel.create(data.resource, data.attrs, data.options)
          .then(handleSuccess(callback))
          .then(emitEvent('create', data.resource))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'update':
      {
        jsDataModel.update(data.resource, data.id, data.attrs, data.options)
          .then(handleSuccess(callback))
          .then(emitEvent('update', data.resource))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'destroy':
      {
        jsDataModel.destroy(data.resource, data.id, data.options)
          .then(handleSuccess(callback))
          .then(emitEvent('destroy', data.resource))
          .catch(handleError(callback))
        ;
        break;
      }
      default:
      {
        return handleError(callback)(`Unsupported method '${data.method}'`);
      }
    }

  });

};
