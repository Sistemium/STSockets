'use strict';

exports.pushCommand = pushCommand;
exports.deviceUUIDRequiredError = deviceUUIDRequiredError;
exports.list = list;

const socket = require('./remoteCommands.socket');

function pushCommand(req, res) {

  let deviceUUID = req.params.deviceUUID;

  let count = socket.pushCommand(deviceUUID, req.body);

  if (count) {
    return res.json({message: 'OK', count: count});
  } else {
    return res.status(404).json({error: 'device not connected'});
  }

}

function deviceUUIDRequiredError(req, res) {
  return res.status(404).json({error: 'deviceUUID is required'});
}

function list(req, res) {

  return res.json(socket.list());

}
