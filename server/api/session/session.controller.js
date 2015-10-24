'use strict';
var events = require('events');
var ee = new events.EventEmitter();
var _ = require('lodash');

var sockData = require('../../components/sockData');
var statusSocket = require('../../api/status/status.socket');

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

  socket.on('sockData:register',function(ack){
    sockData.register(socket,function(res){
      (typeof ack === 'function') && ack({
        isAuthorized: !!res
      });
    });
  });

  socket.on('status:register',function(ack){
    statusSocket.register(socket);
    (typeof ack === 'function') && ack({
      isAuthorized: true
    });
  });


};

exports.list = function (req, res) {

  var data = sockets.map(function (socket){
    return {
      id: socket.id,
      userAgent: socket.userAgent,
      deviceUUID: socket.deviceUUID,
      accessToken: socket.accessToken,
      account: socket.account,
      lastStatus: socket.lastStatus
    };
  });

  return res.json(200,data || []);

};
