'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');

var sockets = [];
var apiurl = 'https://api.sistemium.com/api2/v1/dr50';

var request = require('request');

eventEmitter.on('api:data', function (data) {
  sockets.every(function(socket){
    console.info('api:data:', data);
  });
});

var unRegister = function(socket) {
  var idx = sockets.indexOf(socket);
  if (idx>-1) {
    sockets.splice(idx,1);
  }
};

var postApi = function (data, auth, deviceUUID, userAgent, callback) {

  var options = {
    url: apiurl,
    json: data,
    headers: {
      authorization: auth,
      deviceUUID: deviceUUID,
      "user-agent": userAgent
    }
  };

  request.post(options,function(err,res,body){
    callback(body);
  });

};

exports.register = function(socket) {

  sockets.push(socket);
  console.info('sockData register deviceUUID:', socket.deviceUUID);

  socket.on('disconnect',function(){
    unRegister(socket);
  });

  socket.on('data:v1',function(data,clientAck){

    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    console.info('data:v1', 'id:', socket.id, 'ack:', !!ack, 'payload:', JSON.stringify(data, null, 2));

    postApi (
      data,
      socket.accessToken,
      socket.deviceUUID,
      socket.userAgent,
      clientAck
    );

  });

};
