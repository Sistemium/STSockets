'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');

var sockets = [];

eventEmitter.on('remoteCommands', function (params) {
  sockets.every(function(socket){
    if (socket.deviceUUID === params.deviceUUID) {
      socket.emit('remoteCommands', params.commands);
      console.log('remoteCommands deviceUUID:', params.deviceUUID, 'commands: ', params.commands);
    }
  });
});

var unRegister = function(socket) {
  var idx = sockets.indexOf(socket);
  if (idx>-1) {
    sockets.splice(idx,1);
  }
};


exports.register = function(socket) {
  sockets.push(socket);
  console.log('remoteCommands register deviceUUID:', socket.deviceUUID);
  socket.on('disconnect',function(){
    unRegister(socket);
  });
};

exports.pushCommand = function (deviceUUID,commands) {

  var device = _.find(sockets,{deviceUUID:deviceUUID});

  if (device) {
    eventEmitter.emit('remoteCommands', {
      deviceUUID: deviceUUID,
      commands: commands
    });

    return 1;

  }

  return 0;

};

