'use strict';
let jsDataModel = require('./jsData.model');
let debug = require('debug')('sockets:jsData.socket');
let _ = require('lodash');

function handleSuccess(socket) {
  return reply => {
    socket.emit('eventFromServer', reply);
  }
}

function handleError(socket) {
  return err => {
    debug('error occurred', err);
    socket.emit('eventFromServer', err);
  };
}

exports.register = function (socket) {

  socket.on('jsData', function (data) {

    _.assign(data.options, {
      headers: {
        authorization: socket.accessToken
      }
    });
    debug('jsData event', data);

    switch (data.method) {

      case 'findAll' :
      {
        jsDataModel.findAll(null, data.resource, data.params, data.options)
          .then(handleSuccess(socket))
          .catch(handleError(socket))
        ;
        break;
      }
      case 'find':
      {
        jsDataModel.find(null, data)
          .then(handleSuccess(socket))
          .catch(handleError(socket))
        ;
        break;
      }
      default: {
        throw new Error(`No such method... ${data.method}`);
      }
    }

  });

};
