import _ from 'lodash';
import log from 'sistemium-debug';
import { agentBuild, agentName } from '../../components/util';
import * as jsData from '../jsData/jsData.socket';

const { debug } = log('remoteCommands:socket');
const sockets: any[] = [];

export function pushCommand(deviceUUID: string, commands: any) {

  const matchingSocket = _.find(sockets, socket => {
    return socket.deviceUUID === deviceUUID && !socket.destroyed;
  });

  if (!matchingSocket) {
    return 0;
  }

  matchingSocket.emit('remoteCommands', commands);
  debug('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);

  return 1;

}

export function pushRequest(deviceUUID: string, requests: any) {

  return new Promise( (resolve, reject) => {

    const matchingSocket = _.find(sockets, socket => {
      return socket.deviceUUID === deviceUUID && !socket.destroyed;
    });

    if (!matchingSocket) {
      return reject('device not connected');
    }

    debug('remoteRequest deviceUUID:', deviceUUID, 'requests:', requests);
    matchingSocket.emit('remoteRequests', requests, resolve);

  });

}


export function register(socket: any) {
  sockets.push(socket);
  debug('remoteCommands register deviceUUID:', socket.deviceUUID, agentName(socket), agentBuild(socket));

  socket.on('disconnect', () => {
    unRegister(socket);
  });
}

export function list() {
  return _.map(sockets, (socket: any) => {
    return {
      id: socket.id,
      deviceUUID: socket.deviceUUID
    };
  });
}

/*
 Private Functions
 */


function unRegister(socket: any) {
  let idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
  _.each(socket.jsDataSubscriptions, function (subscription) {
    jsData.unSubscribe(socket)(subscription.id);
  });
}


