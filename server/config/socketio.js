/**
 * Socket.io configuration
 */

'use strict';

var statusSocket = require('../api/status/status.socket');
var remoteCommandsSocket = require('../api/remoteCommands/remoteCommands.socket');
var sockData = require('../components/sockData');
var session = require('../api/session/session.controller');
var jsDataSocket = require('../api/jsData/jsData.socket');


function onDisconnect(socket) {

  console.info('DISCONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

}


function onConnect(socket) {

  console.info('CONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

  socket.userAgent = socket.handshake.headers['user-agent'];

  session.register(socket);

  socket.on ('authorization', function (data,clientAck){

    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    if (!data) {
      return ack({
        isAuthorized: false
      });
    }

    if (data.bundleIdentifier && data.appVersion) {
      socket.userAgent = data.bundleIdentifier + '/' + data.appVersion;
    }

    console.info('authorization:', 'id:', socket.id, socket.userAgent, data.accessToken);

    if (socket.isAuthorized && socket.accessToken === data.accessToken) {
      return ack({
        isAuthorized: true,
        wasAuthorized: true
      });
    }

    if ((socket.isAuthorized = !!data.accessToken)) {
      socket.accessToken = data.accessToken;

      jsDataSocket.register(socket);
      if (data.deviceUUID) {

        socket.deviceUUID = data.deviceUUID;
        socket.deviceInfo = data;

        sockData.register(socket,function(res){
          if (res) {
            //driverSocket.register(socket);
            statusSocket.register(socket);
            remoteCommandsSocket.register(socket);
          }
          ack({
            isAuthorized: !!res
          });
        });
      } else {
        ack({
          isAuthorized: true
        });
      }

    } else {
      delete socket.accessToken;
      delete socket.userId;
      ack({
        isAuthorized: false
      });
    }

  });

  socket.on('info', function (data,clientAck) {
    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    ack((new Date()).toISOString());

    console.info('info:', JSON.stringify(data, null, 2));
  });

}

module.exports = function (socketio) {

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    socket.on('disconnect', function () {
      onDisconnect(socket);
    });

    onConnect(socket);

  });

};
