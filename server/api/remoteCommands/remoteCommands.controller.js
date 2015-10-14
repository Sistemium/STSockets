'use strict';

var socket = require('./remoteCommands.socket');

exports.pushCommand = function(req, res) {

  var deviceUUID = req.params.deviceUUID;

  if (deviceUUID) {
    var l = socket.pushCommand(deviceUUID,req.body);
    if (l) {
      return res.json(200, {message: 'OK', count: l});
    } else {
      return res.json(404, {error: 'device not connected'});
    }

  } else {
    return res.json(400,{error: 'deviceUUID is required'});
  }

};

