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
      debug ('syncPickers', socket.deviceUUID);
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
      debug ('subscribeJsData', event, data);
      var matches = (_.get(data,'resource')||'').match(/^[^\/]*/);
      if (matches.length) {
        needSync (matches[0]);
      }
    }
  }) (filter,function(data){

    jsDataSubscriptions.push({id: data, filter: filter});

  });
}

subscribeJsData('remoteCommands-'+uuid.v4(),['dev/PickingOrder']);

function emitToDevice (deviceUUID, commands) {

  var matchingSockets = _.filter(sockets,{deviceUUID:deviceUUID});

  _.each(matchingSockets,function (socket){
    socket.emit('remoteCommands', commands);
    console.info('remoteCommands deviceUUID:', deviceUUID, 'commands:', commands);
  });

  return matchingSockets.length;

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

eventEmitter.on('remoteCommands', function (params) {
  emitToDevice (params.deviceUUID, params.commands);
});


exports.register = register;
exports.pushCommand = emitToDevice;
exports.list = list;
