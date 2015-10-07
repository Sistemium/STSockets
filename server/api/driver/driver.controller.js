'use strict';

var socket = require('./driver.socket');

exports.driversRefresh = function(req, res) {
  socket.driversRefresh(req.body);
  return res.json(200, {message: 'Socket has been synced'});
};

exports.driverRefresh = function(req, res) {
  socket.driverRefresh(req.body);
  return res.json(200, {message: 'Socket has been synced'});
}
