'use strict';
let jsDataModel = require('./jsData.model');
let debug = require('debug')('sockets:jsData.socket');
let _ = require('lodash');

function handleSuccess(callback) {
  return reply => {
    callback({data: reply});
  }
}

function handleError(callback) {
  return err => {
    debug('error occurred', err);
    callback({error: err})
  };
}

exports.register = function (socket) {

  socket.on('jsData', function (data, callback) {

    data.options = data.options || {};
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
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'find':
      {
        jsDataModel.find(null, data.resource, data.id, data.options)
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'create':
      {
        jsDataModel.create(null, data.resource, data.attrs, data.options.headers)
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'update':
      {
        jsDataModel.update(null, data.resource, data.id, data.attrs, data.options.headers)
          .then(handleSuccess(callback))
          .catch(handleError(callback))
        ;
        break;
      }
      case 'destroy':
      {
        jsDataModel.destroy(null, data.resource, data.id, data.options)
          .then(handleSuccess(callback))
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
