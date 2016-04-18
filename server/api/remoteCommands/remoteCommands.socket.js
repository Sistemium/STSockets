'use strict';

var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');

var sockets = [];


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
}


function register (socket) {
  sockets.push(socket);
  console.info('remoteCommands register deviceUUID:', socket.deviceUUID);
  socket.on('disconnect',function(){
    unRegister(socket);
  });
}


eventEmitter.on('remoteCommands', function (params) {
  emitToDevice (params.deviceUUID, params.commands);
});


exports.register = register;
exports.pushCommand = emitToDevice;

