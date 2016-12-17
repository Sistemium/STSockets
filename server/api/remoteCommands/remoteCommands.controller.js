'use strict';

const socket = require('./remoteCommands.socket');

exports.pushCommand = function(req, res) {

  let deviceUUID = req.params.deviceUUID;

  if (deviceUUID) {
    let l = socket.pushCommand(deviceUUID,req.body);
    if (l) {
      return res.json({message: 'OK', count: l});
    } else {
      return res.status(404).json({error: 'device not connected'});
    }

  } else {
    return res.status(404).json({error: 'deviceUUID is required'});
  }

};

exports.list = function(req, res) {

  return res.json(socket.list());

};
