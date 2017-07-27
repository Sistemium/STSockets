'use strict';

exports.pushRequest = pushRequest;
exports.deviceUUIDRequiredError = deviceUUIDRequiredError;
exports.list = list;

const socket = require('../remoteCommands/remoteCommands.socket');

function pushRequest(req, res) {

  let deviceUUID = req.params.deviceUUID;

  return socket.pushRequest(deviceUUID, req.body).then(response => {
    return res.json(response);
  }).catch(error =>{
    return res.status(404).json({error});
  });

}

function deviceUUIDRequiredError(req, res) {
  return res.status(404).json({error: 'deviceUUID is required'});
}

function list(req, res) {

  return res.json(socket.list());

}
