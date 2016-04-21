'use strict';

var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');
var debug = require ('debug') ('sts:remoteCommands:socket');
var uuid = require ('node-uuid');

var sockets = [];
var jsData = require('../jsData/jsData.socket');
var jsDataSubscriptions = [];

var commands = {
  fullSync: {
    STMSyncer: 'fullSync'
  }
};

function syncPickers (org) {
  
  _.each (sockets, function (socket) {
    
    if (socket.org === org && _.get(socket,'roles.picker')) {
      socket.emit ('remoteCommands', commands.fullSync);
    }
    
  });

}

var needSyncData = {};

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
      debug ('jsData:update', id, event, data);
      var matches = event.match(/^[^\/]*/);
      if (matches.length) {
        needSync (matches[0]);
      }
    }
  }) (filter,function(data){

    jsDataSubscriptions.push({id: data, filter: filter});

  });
}

subscribeJsData(uuid.v4(),['dev/PickingOrder']);

function emitToDevice (deviceUUID, commands) {

  var sockets = _.filter(sockets,{deviceUUID:deviceUUID});

  _.each(sockets,function (socket){
    socket.emit('remoteCommands', commands);
    console.info('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);
  });

  return sockets.length;

}


function unRegister (socket) {
  var idx = sockets.indexOf(socket);
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

  jsData.subscribe ({
    id: socket.id,
    emit: function (event,data){
      debug ('jsData:update', socket.id, event, data);
      socket.emit ('remoteCommands', commands.fullSync);
    }
  }) (['dev/PickingOrder'],function(data){

    socket.jsDataSubscriptions = [
      data
    ];

  });

  socket.on('disconnect',function(){
    unRegister(socket);
  });
}


eventEmitter.on('remoteCommands', function (params) {
  emitToDevice (params.deviceUUID, params.commands);
});


exports.register = register;
exports.pushCommand = emitToDevice;

