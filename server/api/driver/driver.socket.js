'use strict';
const events = require('events');
const eventEmitter = new events.EventEmitter();

const sockets = [];

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

function unRegister(socket) {
  let idx = sockets.indexOf(socket);
  if (idx>-1) {
    sockets.splice(idx,1);
  }
}

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
