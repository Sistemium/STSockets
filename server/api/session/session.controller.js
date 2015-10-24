'use strict';
var events = require('events');
var ee = new events.EventEmitter();
var _ = require('lodash');

var sockets = [];

var unRegister = function(socket) {
  var idx = sockets.indexOf(socket);
  if (idx>-1) {
    sockets.splice(idx,1);
  }
};


exports.register = function(socket) {

  sockets.push(socket);

  console.info('session register id:', socket.id);

  socket.on('disconnect',function(){
    unRegister(socket);
  });

};

exports.list = function (req, res) {

  var data = sockets.map(function (socket){
    return {
      id: socket.id,
      userAgent: socket.userAgent,
      deviceUUID: socket.deviceUUID,
      accessToken: socket.accessToken
    };
  });

  return res.json(200,data || []);

};
