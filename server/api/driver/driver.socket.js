'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();

exports.register = function(socket) {
  eventEmitter.on('drivers:refresh', function (drivers) {
    socket.emit('drivers:refresh', drivers);
  });
  eventEmitter.on('driver:refresh', function (driver) {
    socket.emit('driver:refresh', driver);
  });
};

exports.driversRefresh = function (drivers) {
  eventEmitter.emit('drivers:refresh', drivers);
};

exports.driverRefresh = function (driver) {
  eventEmitter.emit('driver:refresh', driver);
};
