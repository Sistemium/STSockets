'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();

var sockets = [];

eventEmitter.on('drivers:refresh', function (drivers) {
  sockets.every(function(socket){
    socket.emit('drivers:refresh', drivers);
  });
});

eventEmitter.on('driver:refresh', function (driver) {
  sockets.every(function(socket){
    socket.emit('driver:refresh', driver);
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
  socket.on('disconnect',function(){
    unRegister(socket);
  });
};

exports.driversRefresh = function (drivers) {
  eventEmitter.emit('drivers:refresh', drivers);
};

exports.driverRefresh = function (driver) {
  eventEmitter.emit('driver:refresh', driver);
};
