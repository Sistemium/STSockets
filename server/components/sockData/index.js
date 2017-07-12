'use strict';

const events = require('events');
const _ = require('lodash');
const request = require('request');

const apiv3 = require('./st-api-v3');
const debug = require('debug')('sts:sockData');
const config = require('../../config/environment');

const sockets = [];
const apiV1 = config.APIv1;
const apiV3 = config.APIv3;
const rolesUrl = config.pha.roles;

const eventEmitter = new events.EventEmitter();

const authEmitter = require('../auth/emitter');


const liveSearchData = {};

eventEmitter.on('api:data', function (data) {
  sockets.every(() => {
    console.info('api:data:', data);
  });
});

exports.register = sockDataRegister;


function sockDataRegister(socket, ack) {

  let {accessToken, deviceUUID, userAgent} = socket;

  authByToken(accessToken, deviceUUID, userAgent, (res, status) => {

    if (status === 401) {

      console.info(
        'sockData register id', socket.id,
        'not authorized'
      );

      ack(false);

    } else if (!res || !res.account) {

      console.info('sockData register id', socket.id, 'error: ', status);
      //socket.disconnect();

    } else {

      socket.org = res.account.org;
      socket.userId = res.account.code;

      _.assign(socket, _.pick(res, ['account', 'roles', 'token']));

      sockets.push(socket);

      console.info(
        'sockData register id', socket.id,
        'deviceUUID:', deviceUUID,
        'org:', socket.org,
        'userId:', socket.userId
      );

      socket.touch();

      register(socket);

      authEmitter.emit(`${socket.org}/auth`, socket);

      ack(true);

    }

  });

}


function unRegister(socket) {
  let idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
}

function postApi(data, socket, callback) {

  let
    auth = socket.accessToken,
    userAgent = socket.userAgent,
    deviceUUID = socket.deviceUUID,
    org = socket.org
  ;

  let options = {
    url: apiV1 + org,
    json: data,
    headers: {
      authorization: auth,
      deviceUUID: deviceUUID,
      'user-agent': userAgent,
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    }
  };

  return request.post(options, function (err, res, body) {
    callback(body);
  });

}


function authByToken(token, deviceUUID, userAgent, callback) {

  let options = {
    url: rolesUrl,
    headers: {
      authorization: token,
      deviceUUID: deviceUUID,
      "user-agent": userAgent
    }
  };

  request.get(options, function (err, res, body) {

    let jsonBody;

    try {
      jsonBody = JSON.parse(body);
    } catch (x) {
      jsonBody = false;
    }

    callback(err ? false : jsonBody, res && res.statusCode);
  });

}

function getLiveSearchData(entity, socket) {

  let
    token = socket.accessToken,
    userAgent = socket.userAgent,
    deviceUUID = socket.deviceUUID,
    org = socket.org
  ;

  let options = {
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

  return new Promise((resolve, reject) => {

    let lsd = liveSearchData [entity];

    console.info('getLiveSearchData entity:', entity, 'keys:', Object.keys(liveSearchData));

    request.get(options, onResponse);

    function onResponse(err, res, body) {

      let jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (jsonBody && res.statusCode === 200) {
        console.info('getLiveSearchData count:', jsonBody.length, res.headers.etag);
        lsd.store = _.union(lsd.store || [], jsonBody);

        if (res.headers.etag) {
          options.headers ['if-none-match'] = (lsd.etag = res.headers.etag);
          return request.get(options, onResponse);
        }
        resolve(lsd.store);
      } else if (res.statusCode === 400) {
        lsd.store = [];
        resolve(lsd.store);
      } else if (res.statusCode === 204) {
        lsd.store = _.sortBy(_.uniq(lsd.store, 'id'), 'name');
        console.info('getLiveSearchData final count:', lsd.store.length);
        console.info('getLiveSearchData final sample:', _.first(lsd.store));
        resolve(lsd.store);
      } else {
        console.error('getLiveSearchData error:', res.statusCode);
        reject();
      }

      liveSearchData[entity].busy = false;

    }

  })

}


function liveSearchBy(query, socket, callback) {

  let entity = query.entity;
  let entityData = liveSearchData[entity];
  let limit = query.limit || 50;

  if (!entityData) {

    entityData = (liveSearchData [entity] = {});
    liveSearchData [entity].busy = getLiveSearchData(entity, socket);

  }

  if (entityData.busy) {

    console.log('liveSearchBy busy:');

    entityData.busy.then(function () {
      liveSearchBy(query, socket, callback);
    });

  } else {

    let re = new RegExp(query.searchText, 'ig');
    let matches = _.filter(entityData.store, function (e) {
      return e.name && e.name.match(re);
    });

    console.log('liveSearchBy matches:', matches.length,
      'of', entityData.store ? entityData.store.length : 0,
      'for:', re
    );
    socket.touch();
    callback(_.map(_.head(matches, limit), function (item) {
      return _.pick(item, query.columns);
    }));

  }

}

function register(socket) {

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('data:v1', function (data, clientAck) {

    let ack = (typeof clientAck === 'function') ? clientAck : function () {
    };

    socket.touch();

    console.info('data:v1', 'id:', socket.id, 'ack:', !!ack, 'payload:', (JSON.stringify(data) || '').length);

    postApi(data, socket, ack)
      .on('response', () => {
        socket.touch()
      });

  });

  socket.on('livesearch', function (data, clientAck) {

    let ack = (typeof clientAck === 'function') ? clientAck : function () {
    };

    socket.touch();

    console.info('livesearch', 'id:', socket.id, 'query:', JSON.stringify(data, null, 2));

    liveSearchBy(data, socket, ack);

  });

  socket.on('get:v3', function (request, clientAck) {

    let ack = (typeof clientAck === 'function') ? clientAck : function (res) {
      console.log('empty callback:', res);
    };

    socket.touch();

    console.info('data:v3', 'id:', socket.id, 'query:', JSON.stringify(request, null, 2));

    apiv3.get(request, socket)
      .then(function (res) {
        ack(res);
      });

  });

}
