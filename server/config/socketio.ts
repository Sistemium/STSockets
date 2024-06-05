import _ from 'lodash';
import log from 'sistemium-debug';
import { agentName, agentBuild } from '../components/util';
import { authorizationForSocket } from '../components/auth';
import * as remoteCommandsSocket from '../api/remoteCommands/remoteCommands.socket';
import * as sockData from '../components/sockData';
import * as session from '../api/session/session.controller';
import * as jsDataSocket from '../api/jsData/jsData.socket';

const { debug, error } = log('socket.id')

function onDisconnect(socket: any) {

  debug('DISCONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

}


function onConnect(socket: any) {

  debug('CONNECTED',
    'id:', socket.id,
    'address:', socket.handshake.headers['x-real-ip'] || socket.handshake.address
  );

  socket.setMaxListeners(20);

  socket.userAgent = socket.handshake.headers['user-agent'];

  session.register(socket);

  socket.on('authorization', onAuthorizationCallback(socket));

  socket.on('info', (data: any, clientAck: any) => {
    const ack = (typeof clientAck === 'function') ? clientAck : _.noop;

    ack((new Date()).toISOString());

    debug('info:', 'userId:', socket.userId, 'deviceUUID:', socket.deviceUUID, 'data:', JSON.stringify(data));
  });

}


function onAuthorizationCallback(socket: any) {

  return (data: any, clientAck: any) => {

    const ack = _.isFunction(clientAck) ? clientAck : _.noop;

    if (!data) {
      return ack({ isAuthorized: false });
    }

    if (data.bundleIdentifier && data.appVersion) {
      socket.userAgent = `${data.bundleIdentifier}/${data.appVersion}`;
    }

    debug('authorization:', socket.id, agentName(socket), agentBuild(socket), data.accessToken);

    if (socket.isAuthorized && socket.accessToken === data.accessToken) {
      return ack({
        isAuthorized: true,
        wasAuthorized: true
      });
    }

    if (!socket.isAuthorized && data.accessToken) {

      socket.accessToken = data.accessToken;
      socket.deviceUUID = data.deviceUUID;
      socket.deviceInfo = socket.deviceUUID ? data : undefined;

      authorizationForSocket(socket)
        .then((isAuthorized: any) => {

          socket.isAuthorized = !!isAuthorized;

          if (isAuthorized) {
            jsDataSocket.register(socket);
            session.registerSubs(socket);
            sockData.register(socket);
            // statusSocket.register(socket);
            remoteCommandsSocket.register(socket);

          }

          ack({ isAuthorized: socket.isAuthorized });

        })
        .catch((err: any) => {
          if (err) {
            error(err);
          }
          ack({ error: err });
        });

    } else {

      if (!data.accessToken) {
        jsDataSocket.register(socket);
      }

      delete socket.accessToken;
      delete socket.userId;

      ack({ isAuthorized: false });

    }

  };

}


export default function config(socketIO: any) {

  socketIO.on('connection', (socket: any) => {

    socket.address = socket.handshake.address !== null ?
      `${socket.handshake.address.address}:${socket.handshake.address.port}` :
      process.env.DOMAIN;

    socket.connectedAt = new Date();

    socket.on('disconnect', () => {
      onDisconnect(socket);
    });

    onConnect(socket);

  });

}
