/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var driverSocket = require('../api/driver/driver.socket');
var statusSocket = require('../api/status/status.socket');
var remoteCommandsSocket = require('../api/remoteCommands/remoteCommands.socket');
var sockData = require('../components/sockData');

// When the user disconnects.. perform this
function onDisconnect(socket) {

  console.info('DISCONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

}

// When the user connects.. perform this
function onConnect(socket) {

  console.info('CONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

  socket.userAgent = socket.handshake.headers['user-agent'];

  socket.on ('authorization', function (data,clientAck){

    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    console.info('authorization:', 'id:', socket.id, JSON.stringify(data, null, 2));

    if (socket.isAuthorized = !!data.accessToken) {
      socket.accessToken = data.accessToken;

      if (data.deviceUUID) {
        socket.deviceUUID = data.deviceUUID;
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
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
    });

    // Call onConnect.
    onConnect(socket);

  });
};
