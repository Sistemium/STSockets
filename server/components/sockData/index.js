'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');

var sockets = [];
var apiurl = 'https://api.sistemium.com/api2/v1/';
var rolesUrl = 'https://api.sistemium.com/pha/roles';

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

var postApi = function (data, auth, org, deviceUUID, userAgent, callback) {

  var options = {
    url: apiurl + org,
    json: data,
    headers: {
      authorization: auth,
      deviceUUID: deviceUUID,
      "user-agent": userAgent
    }
  };

  return request.post(options,function(err,res,body){
    callback(body);
  });

};


var authByToken = function (token,deviceUUID,userAgent,callback) {

  var options = {
    url: rolesUrl,
    headers: {
      authorization: token,
      deviceUUID: deviceUUID,
      "user-agent": userAgent
    }
  };

  request.get(options,function(err,res,body){
    callback(err ? false : JSON.parse(body));
  });

};

exports.register = function(socket,ack) {

  authByToken(socket.accessToken,socket.deviceUUID,socket.userAgent,function(res){

    if (!(res && res.account)) {

      console.info(
        'sockData register id', socket.id,
        'not authorized'
      );

      ack(false);

    } else {

      socket.org = res.account.org;
      socket.userId = res.account.code;
      _.extend (socket, res);

      sockets.push(socket);

      console.info(
        'sockData register id', socket.id,
        'deviceUUID:', socket.deviceUUID,
        'org:', socket.org,
        'userId:', socket.userId
      );

      socket.touch();

      socket.on('disconnect', function () {
        unRegister(socket);
      });

      socket.on('data:v1', function (data, clientAck) {

        var ack = (typeof clientAck === 'function') ? clientAck : function () {
        };

        socket.touch();

        console.info('data:v1', 'id:', socket.id, 'ack:', !!ack, 'payload:', JSON.stringify(data, null, 2));

        postApi(
          data,
          socket.accessToken,
          socket.org,
          socket.deviceUUID,
          socket.userAgent,
          clientAck
        ).on('response',socket.touch);

      });

      ack(true);

    }

  });

};
