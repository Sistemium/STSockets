'use strict';

const events = require('events');
const _ = require('lodash');
const uuid = require ('node-uuid');
const debug = require ('debug') ('sts:remoteCommands:socket');

const eventEmitter = new events.EventEmitter();
const sockets = [];
const jsData = require('../jsData/jsData.socket');
const jsDataSubscriptions = [];

const commands = {
  fullSync: {
    STMSyncer: 'fullSync'
  }
};

const needSyncData = {};


subscribeJsData('remoteCommands-'+uuid.v4(),['dev/PickingOrder','bs/PickingOrder']);

eventEmitter.on('remoteCommands', function (params) {
  emitToDevice (params.deviceUUID, params.commands);
});

exports.register = register;
exports.pushCommand = emitToDevice;
exports.list = list;


function syncPickers (org) {

  _.each (sockets, function (socket) {

    if (socket.org === org && _.get(socket,'roles.picker')) {
      socket.emit ('remoteCommands', commands.fullSync);
      debug ('syncPickers', socket.deviceUUID);
    }

  });

}

function needSync (org) {

  if (! needSyncData [org]) {
    needSyncData [org] = true;
    syncPickers(org);
    setTimeout(function (){
      needSyncData [org] = false;
    },1000);
  }

}


function subscribeJsData (id, filter) {

  jsData.subscribe ({
    id: id,
    emit: function (event,data){
      debug ('subscribeJsData', event, data);
      let matches = (_.get(data,'resource')||'').match(/^[^\/]*/);
      if (matches.length) {
        needSync (matches[0]);
      }
    }
  }) (filter,function(data){

    jsDataSubscriptions.push({id: data, filter: filter});

  });
}


function emitToDevice (deviceUUID, commands) {

  let matchingSockets = _.filter(sockets,{deviceUUID:deviceUUID});

  _.each(matchingSockets,function (socket){
    socket.emit('remoteCommands', commands);
    console.info('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);
  });

  return matchingSockets.length;

}


function unRegister (socket) {
  let idx = sockets.indexOf(socket);
  if (idx>-1) {
    sockets.splice(idx,1);
  }
  _.each (socket.jsDataSubscriptions, function(subscription) {
    jsData.unSubscribe(socket) (subscription.id);
  });
}


function register (socket) {
  sockets.push(socket);
  console.info('remoteCommands register deviceUUID:', socket.deviceUUID);

  socket.on('disconnect',function(){
    unRegister(socket);
  });
}

function list () {
  return _.map(sockets,function (socket) {
    return {
      id: socket.id,
      deviceUUID: socket.deviceUUID
    };
  });
}
