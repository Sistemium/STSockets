/**
 * Socket.io configuration
 */

'use strict';

module.exports = config;

import _ from 'lodash';

const statusSocket = require('../api/status/status.socket');
const remoteCommandsSocket = require('../api/remoteCommands/remoteCommands.socket');
const sockData = require('../components/sockData');
const session = require('../api/session/session.controller');
const jsDataSocket = require('../api/jsData/jsData.socket');
const authorizationForSocket = require('../components/auth').authorizationForSocket;

import {agentName, agentBuild} from '../components/util';


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

  socket.on('authorization', onAuthorizationCallback(socket));

  socket.on('info', (data, clientAck) => {
    let ack = (typeof clientAck === 'function') ? clientAck : function () {
    };

    ack((new Date()).toISOString());

    console.info('info:', 'userId:', socket.userId, 'deviceUUID:', socket.deviceUUID, 'data:', JSON.stringify(data));
  });

}


function onAuthorizationCallback(socket) {

  return (data, clientAck) => {

    let ack = _.isFunction(clientAck) ? clientAck : _.noop;

    if (!data) {
      return ack({isAuthorized: false});
    }

    if (data.bundleIdentifier && data.appVersion) {
      socket.userAgent = data.bundleIdentifier + '/' + data.appVersion;
    }

    console.info('authorization:', socket.id, agentName(socket), agentBuild(socket), data.accessToken);

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

        sockData.register(socket, res => {

          if (res) {
            statusSocket.register(socket);
            remoteCommandsSocket.register(socket);
          }

          ack({isAuthorized: !!res});

        });

      } else {

        authorizationForSocket(socket)
          .then(authorized => {
            ack({isAuthorized: !!authorized});
          })
          .catch(error => {
            if (error) {
              console.error(error);
            }
            ack({error: error});
          });

      }

    } else {

      delete socket.accessToken;
      delete socket.userId;

      ack({isAuthorized: false});

    }

  };

}


function config(socketIO) {

  socketIO.on('connection', function (socket) {

    socket.address = socket.handshake.address !== null ?
    socket.handshake.address.address + ':' + socket.handshake.address.port :
      process.env.DOMAIN;

    socket.connectedAt = new Date();

    socket.on('disconnect', function () {
      onDisconnect(socket);
    });

    onConnect(socket);

  });

}
