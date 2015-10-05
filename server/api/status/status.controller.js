'use strict';

var _ = require('lodash');
var events = require('events');
var socket = require('./status.socket');

// Creates a new status in the DB.
exports.socketRefresh = function(req, res) {
  socket.registerSocketRefresh(req.body);
  return res.json(200, {message: 'Socket has been synced'});
};
