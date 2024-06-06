import events from 'events';
import _ from 'lodash';
import log from 'sistemium-debug';
import * as sockData from '../../components/sockData';

const { debug } = log('session.controller');

const pushRequest = require('../remoteCommands/remoteCommands.socket').pushRequest;
const pushCommand = require('../remoteCommands/remoteCommands.socket').pushCommand;
const authorizedForSocketChange = require('../../components/auth').authorizedForSocketChange;

const ee = new events.EventEmitter();
const sockets: any[] = [];

function socketData(socket: any) {
  const di = socket.deviceInfo && {
    deviceUUID: socket.deviceInfo.deviceUUID,
    deviceName: socket.deviceInfo.deviceName,
    devicePlatform: socket.deviceInfo.devicePlatform,
    bundleVersion: socket.deviceInfo.bundleVersion,
    systemVersion: socket.deviceInfo.systemVersion,
    buildType: socket.deviceInfo.buildType
  };
  return {
    id: socket.id,
    userAgent: socket.userAgent,
    deviceUUID: socket.deviceUUID,
    accessToken: socket.accessToken,
    account: socket.account,
    lastStatus: socket.lastStatus,
    ts: socket.ts,
    cts: socket.connectedAt,
    deviceInfo: di
  };
}

function unRegister(socket: any) {
  const idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
  socket.destroyed = true;
  ee.emit('session:state', socket);
}

function touchFn(this: any) {
  const socket = this || {};
  socket.ts = new Date();
  ee.emit('session:state', socket);
}

ee.on('session:state', function (changedSocket) {

  _.each(sockets, function (socket) {
    if (socket.subscriber['session:state']) {

      if (authorizedForSocketChange(socket, changedSocket)) {

        if (changedSocket.destroyed) {
          socket.emit('session:state:destroy', changedSocket.id);
          debug('session:state:', socket.id, 'destroyedSocket:', changedSocket.id);
        } else {
          socket.emit('session:state', socketData(changedSocket));
          debug('session:state:', socket.id, 'changedSocket:', changedSocket.id);
        }

      }
    }
  });

});


export function register(socket: any) {

  sockets.push(socket);

  socket.touch = touchFn;
  socket.subscriber = {};

  debug('session register id:', socket.id);

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.touch();

};

export function registerSubs(socket: any) {

  socket.on('sockData:register', () => {
    sockData.register(socket);
  });

  socket.on('session:state:register', (ack: any) => {
    socket.subscriber ['session:state'] = true;
    debug('session:state:register id:', socket.id);
    if (typeof ack === 'function') {
      ack({
        isAuthorized: true
      });
    }
  });

  socket.on('session:state:unregister', (ack: any) => {
    socket.subscriber ['session:state'] = false;
    debug('session:state:unregister id:', socket.id);
    if (typeof ack === 'function') {
      ack({
        isAuthorized: true
      });
    }
  });

  socket.on('session:state:findAll', function (ack?: any) {
    debug('session:state:findAll id:', socket.id);
    const data = _.map(sockets, (socket: any) => {
      return socketData(socket);
    });
    if (typeof ack === 'function') {
      ack({ data });
    }
  });

  socket.on('device:pushRequest', (deviceUUID: string, request: any, ack: any) => {

    pushRequest(deviceUUID, request)
      .then((response: any) => {
        ack(response);
      })
      .catch((error: any) => {
        ack({ error });
      });

  });

  socket.on('device:pushCommand', function (deviceUUID: string, command: any, ack: any) {

    const result = pushCommand(deviceUUID, command);

    ack(result);

  });

}

export function list(req: any, res: any) {

  const selfOrg = _.get(req.auth, 'account.org');

  const data = _.filter(sockets, (socket: any) => {
    return _.get(socket, 'account.org') === selfOrg;
  }).map((socket: any) => {
    return socketData(socket);
  });

  return res.status(200).json(data || []);

}
