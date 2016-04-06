'use strict';
let jsDataModel = require('./jsData.model');
let debug = require('debug')('sockets:jsData.socket');

exports.register = function (socket) {

  socket.on('jsData', function (data) {

    debug('jsData event', data);
    switch (data.method) {

      case 'findAll' :
      {
        data.headers = {};
        data.headers.authorization = socket.accessToken;
        jsDataModel.findAll(data.options, data.headers, null, data.resource)
          .then(reply => {
            debug('reply from findAll', reply);
            socket.emit('eventFromServer', reply);
          })
          .catch(err => {
            debug('error occurred', err);
            socket.emit('eventFromServer', err);
          })
        ;
        break;
      }
      case 'find':
      {
        jsDataModel.find(data.options, data.headers, null, data.resource)
          .then(reply => {
            socket.emit('eventFromServer', reply);
          })
          .catch(err => {
            socket.emit('eventFromServer', err);
          })
        ;
      }

    }


  });

};
