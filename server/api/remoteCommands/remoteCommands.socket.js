'use strict';

const events = require('events');
const _ = require('lodash');
const uuid = require('node-uuid');
const debug = require('debug')('sts:remoteCommands:socket');

// const eventEmitter = new events.EventEmitter();
const sockets = [];
import {agentBuild, agentName} from '../../components/util';
const jsData = require('../jsData/jsData.socket');

/*
 Private Data
 */

/*
 Init
 */

// eventEmitter.on('remoteCommands', function (params) {
//   emitToDevice(params.deviceUUID, params.commands);
// });

/*
 Public
 */

exports.register = register;
exports.pushCommand = emitToDevice;
exports.pushRequest = pushRequest;
exports.list = list;


function emitToDevice(deviceUUID, commands) {

  let matchingSocket = _.find(sockets, socket => {
    return socket.deviceUUID === deviceUUID && !socket.destroyed;
  });

  if (!matchingSocket) {
    return 0;
  }

  matchingSocket.emit('remoteCommands', commands);
  console.info('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);

  return 1;

}

function pushRequest(deviceUUID, requests) {

  return new Promise(function (resolve, reject) {

    let matchingSocket = _.find(sockets, socket => {
      return socket.deviceUUID === deviceUUID && !socket.destroyed;
    });

    if (!matchingSocket) {
      reject('device not connected');
    }

    console.info('remoteRequest deviceUUID:', deviceUUID, 'requests:', requests);
    matchingSocket.emit('remoteRequests', requests, response => resolve(response));

  });

}


function register(socket) {
  sockets.push(socket);
  console.info('remoteCommands register deviceUUID:', socket.deviceUUID, agentName(socket), agentBuild(socket));

  socket.on('disconnect', function () {
    unRegister(socket);
  });
}

function list() {
  return _.map(sockets, function (socket) {
    return {
      id: socket.id,
      deviceUUID: socket.deviceUUID
    };
  });
}

/*
 Private Functions
 */


function unRegister(socket) {
  let idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
  _.each(socket.jsDataSubscriptions, function (subscription) {
    jsData.unSubscribe(socket)(subscription.id);
  });
}


