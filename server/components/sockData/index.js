'use strict';
var events = require('events');
var eventEmitter = new events.EventEmitter();
var _ = require('lodash');
var config = require('../../config/environment');

var sockets = [];
var apiV1 = config.APIv1;
var apiV3 = config.APIv3;

var rolesUrl = 'https://api.sistemium.com/pha/roles';

var request = require('request');

var Q = require ('q');

var apiv3 = require('./st-api-v3');
var debug = require ('debug') ('sts:sockData');

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

var postApi = function (data, socket, callback) {

  var
    auth = socket.accessToken,
    userAgent = socket.userAgent,
    deviceUUID = socket.deviceUUID,
    org = socket.org
  ;

  var options = {
    url: apiV1 + org,
    json: data,
    headers: {
      authorization: auth,
      deviceUUID: deviceUUID,
      'user-agent': userAgent,
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
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

    var jsonBody;

    try {
      jsonBody = JSON.parse(body);
    } catch (x) {
      jsonBody = false;
    }

    callback(err ? false : jsonBody, res && res.statusCode);
  });

};

var liveSearchData = {};

var getLiveSearchData = function (entity, socket) {

  var
    token = socket.accessToken,
    userAgent = socket.userAgent,
    deviceUUID = socket.deviceUUID,
    org = socket.org
  ;

  var options = {
    url: apiV3 + org + '/' + entity,
    headers: {
      authorization: token,
      deviceUUID: deviceUUID,
      "user-agent": userAgent,
      'if-none-match': '*',
      'page-size': '500',
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    }
  };

  var q = Q.defer ();

  var r = function (resolve,reject){

    console.info ('getLiveSearchData entity:', entity, 'keys:', Object.keys(liveSearchData));
    var lsd = liveSearchData [entity];

    var onResponse = function(err,res,body){

      var jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (jsonBody && res.statusCode === 200) {
        console.info ('getLiveSearchData count:', jsonBody.length, res.headers.etag);
        lsd.store = _.union (lsd.store || [], jsonBody);

        if (res.headers.etag) {
          options.headers ['if-none-match'] = (lsd.etag = res.headers.etag);
          return request.get(options, onResponse);
        }
        resolve (lsd.store);
      } else if (res.statusCode === 400) {
        lsd.store = [];
        resolve (lsd.store);
      } else if (res.statusCode === 204) {
        lsd.store = _.sortBy(_.uniq (lsd.store,'id'),'name');
        console.info ('getLiveSearchData final count:', lsd.store.length);
        console.info ('getLiveSearchData final sample:', _.first(lsd.store));
        resolve (lsd.store);
      } else {
        console.error ('getLiveSearchData error:', res.statusCode);
        reject ();
      }

      liveSearchData[entity].busy = false;

    };

    request.get(options,onResponse);

  };

  r (q.resolve, q.reject);

  return q.promise;

};


var liveSearchBy = function (query,socket,callback) {

  var entity = query.entity;
  var entityData = liveSearchData[entity];
  var limit = query.limit || 50;

  if (!entityData) {

    entityData = (liveSearchData [entity] = {});
    liveSearchData [entity].busy = getLiveSearchData(entity, socket);

  }

  if (entityData.busy) {

    console.log ('liveSearchBy busy:');

    entityData.busy.then(function () {
      liveSearchBy (query, socket, callback);
    });

  } else {

    var re = new RegExp(query.searchText,'ig');
    var matches = _.filter (entityData.store, function (e){
      return e.name && e.name.match(re);
    });

    console.log ('liveSearchBy matches:', matches.length,
      'of', entityData.store ? entityData.store.length : 0,
      'for:', re
    );
    socket.touch();
    callback(_.map(_.head (matches,limit), function(item) {
      return _.pick(item, query.columns);
    }));

  }

};

var register = function (socket) {

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('data:v1', function (data, clientAck) {

    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    socket.touch();

    console.info('data:v1', 'id:', socket.id, 'ack:', !!ack, 'payload:', (JSON.stringify(data)||'').length);

    postApi (data, socket, ack).on ('response',function () {
      socket.touch()
    });

  });

  socket.on('livesearch', function (data, clientAck) {

    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    socket.touch();

    console.info('livesearch', 'id:', socket.id, 'query:', JSON.stringify(data, null, 2));

    liveSearchBy (data,socket,ack);

  });

  socket.on('get:v3', function (request, clientAck) {

    var ack = (typeof clientAck === 'function') ? clientAck : function (res) {
      console.log ('empty callback:', res);
    };

    socket.touch();

    console.info('data:v3', 'id:', socket.id, 'query:', JSON.stringify(request, null, 2));

    apiv3.get(request,socket)
      .then (function (res) {
        ack (res);
      });

  });

};

exports.register = function(socket,ack) {

  authByToken(socket.accessToken,socket.deviceUUID,socket.userAgent,function(res,status){

    if (status === 401) {

      console.info(
        'sockData register id', socket.id,
        'not authorized'
      );

      ack(false);

    } else if (!(res && res.account)) {
      console.info('sockData register id', socket.id, 'error: ', status);
      //socket.disconnect();
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

      register (socket);

      ack(true);

    }

  });

};
