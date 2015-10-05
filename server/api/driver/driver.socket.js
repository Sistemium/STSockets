/**
 * Broadcast updates to client when the model changes
 */

'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();

exports.register = function(socket) {
  eventEmitter.on('socket:refresh', function (data) {
    socket.emit('driver:refresh', data);
  });
};

exports.socketRefresh = function (body) {
  eventEmitter.emit('socket:refresh', body);
};
