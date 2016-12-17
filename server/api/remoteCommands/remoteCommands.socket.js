'use strict';

const events = require('events');
const _ = require('lodash');
const uuid = require('node-uuid');
const debug = require('debug')('sts:remoteCommands:socket');

const eventEmitter = new events.EventEmitter();
const sockets = [];
import {agentBuild, agentName} from '../../components/util';
const jsData = require('../jsData/jsData.socket');

/*
 Private Data
 */

const jsDataSubscriptions = [];
const needSyncData = {};

const commandsData = {

  fullSync: {
    STMSyncer: 'fullSync'
  },

  find: (resource, id) => {
    return {
      STMSocketController: {
        'sendFindWithValue:': {
          method: 'find',
          resource: resource,
          id: id
        }
      }
    }
  }

};

/*
 Init
 */

subscribeFullSyncJsData('remoteCommands-' + uuid.v4(), [
  'dev/PickingOrder', 'bs/PickingOrder',
]);

const sales = {
  id: 'remoteCommands-SisSales' + uuid.v4(),
  emit: propagateToSisSales
};

subscribeJsData(sales, [
  'dr50/SaleOrder', 'dr50/SaleOrderPosition',
  'dr50/RecordStatus'
]);

eventEmitter.on('remoteCommands', function (params) {
  emitToDevice(params.deviceUUID, params.commands);
});

/*
 Public
 */

exports.register = register;
exports.pushCommand = emitToDevice;
exports.list = list;


function emitToDevice(deviceUUID, commands) {

  let matchingSockets = _.filter(sockets, {deviceUUID: deviceUUID});

  _.each(matchingSockets, function (socket) {
    socket.emit('remoteCommands', commands);
    console.info('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);
  });

  return matchingSockets.length;

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

function syncPickers(org) {

  _.each(sockets, function (socket) {

    if (socket.org === org && _.get(socket, 'roles.picker')) {
      socket.emit('remoteCommands', commandsData.fullSync);
      debug('syncPickers', socket.deviceUUID);
    }

  });

}

function needSync(org) {

  if (!needSyncData [org]) {
    needSyncData [org] = true;
    syncPickers(org);
    setTimeout(function () {
      needSyncData [org] = false;
    }, 1000);
  }

}


function receiveEmit(event, data) {

  debug('subscribeJsData', event, data);

  let matches = (_.get(data, 'resource') || '').match(/^[^\/]*/);

  if (matches.length) {
    needSync(matches[0]);
  }

}


function propagateToSisSales(event, data) {

  debug('propagateToSisSales', event, data);

  let resource = _.get(data, 'resource');
  let id = _.get(data, 'data.id');

  if (!resource && id) return;

  let matches = resource.match(/^[^\/]*/);
  let org = matches[0];

  if (!org) return;

  _.each(sockets, socket => {

    debug('propagateToSisSales', socket.org, agentName(socket), agentBuild(socket));

    if (agentBuild(socket) >= 231 && agentName(socket) === 'iSisSales' && socket.org === org) {
      socket.emit('remoteCommands', commandsData.find(resource, id));
      debug('propagateToSisSales:device', socket.deviceUUID, `${resource}/${id}`);
    }

  });

}

function subscribeFullSyncJsData(id, filter) {
  subscribeJsData({
    id: id,
    emit: receiveEmit
  }, filter);
}

function subscribeJsData(subscriber, filter) {

  jsDataSubscriptions.push({
    id: jsData.subscribe(subscriber)(filter),
    filter: filter
  });

}


function unRegister(socket) {
  let idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
  _.each(socket.jsDataSubscriptions, function (subscription) {
    jsData.unSubscribe(socket)(subscription.id);
  });
}


