'use strict';

var _ = require('lodash');
var socket = require('./status.socket');

exports.socketRefresh = function(req, res) {
  socket.socketRefresh(req.body);
  return res.json(200, {message: 'Socket has been synced'});
};
