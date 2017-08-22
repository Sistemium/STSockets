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

  find: (entity, id) => {
    return {
      STMSyncer: {
        'sendFindWithValue:': {
          entity: entity,
          id: id
        }
      }
    }
  },

  syncEntity: (entity) => {
    return {
      STMSyncer: {
        'receiveEntities:': [entity]
      }
    }
  }

};

/*
 Init
 */

subscribeFullSyncJsData('remoteCommands-' + uuid.v4(), [
  'dev/PickingOrder', 'bs/PickingOrder'
]);

const sales = {
  id: 'remoteCommands-SisSales' + uuid.v4(),
  emit: propagateToSisSales
};

subscribeJsData(sales, [
  'dr50/SaleOrder', 'dr50/SaleOrderPosition',
  'dr50/RecordStatus',
  'dr50/Stock',
  'dr50/Outlet',
  'r50/SaleOrder', 'r50/SaleOrderPosition',
  'r50/RecordStatus',
  'r50/Stock',
  'r50/Outlet'
]);

eventEmitter.on('remoteCommands', function (params) {
  emitToDevice(params.deviceUUID, params.commands);
});

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

  let resourceName = _.first(resource.match(/[^\/]*$/));

  _.each(sockets, socket => {

    if (agentBuild(socket) >= 301 && agentBuild(socket) < 340 && agentName(socket) === 'iSisSales' && socket.org === org) {

      debug('propagateToSisSales', socket.org, agentName(socket), agentBuild(socket));

      if (id) {
        socket.emit('remoteCommands', commandsData.find(resourceName, id));
        debug('propagateToSisSales:device', socket.deviceUUID, `${resource}/${id}`);
      } else if (resourceName) {
        socket.emit('remoteCommands', commandsData.syncEntity(resourceName));
        debug('propagateToSisSales:device', socket.deviceUUID, `${resourceName}`);
      }

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


