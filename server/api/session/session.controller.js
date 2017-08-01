'use strict';

const events = require('events');
const _ = require('lodash');
const debug = require('debug')('sts:session.controller');

const sockData = require('../../components/sockData');
const statusSocket = require('../../api/status/status.socket');

const ee = new events.EventEmitter();
const sockets = [];

function socketData(socket) {
  let di = socket.deviceInfo && {
      deviceUUID: socket.deviceInfo.deviceUUID,
      deviceName: socket.deviceInfo.deviceName,
      devicePlatform: socket.deviceInfo.devicePlatform,
      bundleVersion: socket.deviceInfo.bundleVersion,
      systemVersion: socket.deviceInfo.systemVersion,
      buildType: socket.deviceInfo.buildType
    };
  return {
    id: socket.id,
    userAgent: socket.userAgent,
    deviceUUID: socket.deviceUUID,
    accessToken: socket.accessToken,
    account: socket.account,
    lastStatus: socket.lastStatus,
    ts: socket.ts,
    cts:socket.connectedAt,
    deviceInfo: di
  };
}

function unRegister(socket) {
  let idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
  socket.destroyed = true;
  ee.emit('session:state', socket);
}

function touchFn() {
  /*jshint validthis:true */
  let socket = this || {};
  socket.ts = new Date();
  ee.emit('session:state', socket);
}

ee.on('session:state', function (changedSocket) {

  _.each(sockets, function (socket) {
    if (socket.subscriber['session:state']) {

      if (socket.org === changedSocket.org) {

        if (changedSocket.destroyed) {
          socket.emit('session:state:destroy', changedSocket.id);
          debug('session:state:', socket.id, 'destroyedSocket:', changedSocket.id);
        } else {
          socket.emit('session:state', socketData(changedSocket));
          debug('session:state:', socket.id, 'changedSocket:', changedSocket.id);
        }

      }
    }
  });

});


exports.register = function (socket) {

  sockets.push(socket);

  socket.touch = touchFn;
  socket.subscriber = {};

  console.info('session register id:', socket.id);

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('sockData:register', function (ack) {
    sockData.register(socket, function (res) {
      if (typeof ack === 'function') {
        ack({
          isAuthorized: !!res
        });
      }
    });
  });

  socket.on('status:register', function (ack) {
    statusSocket.register(socket);
    if (typeof ack === 'function') {
      ack({
        isAuthorized: true
      });
    }
  });

  socket.on('session:state:register', function (ack) {
    socket.subscriber ['session:state'] = true;
    console.log('session:state:register id:', socket.id);
    if (typeof ack === 'function') {
      ack({
        isAuthorized: true
      });
    }
  });

  socket.on('session:state:unregister', function (ack) {
    socket.subscriber ['session:state'] = false;
    console.log('session:state:unregister id:', socket.id);
    if (typeof ack === 'function') {
      ack({
        isAuthorized: true
      });
    }
  });

  socket.touch();

};

exports.list = function (req, res) {

  let selfOrg = _.get(req.auth, 'account.org');

  let data = _.filter(sockets, function (socket) {
    return _.get(socket, 'account.org') === selfOrg;
  }).map(function (socket) {
    return socketData(socket);
  });

  return res.status(200).json(data || []);

};
