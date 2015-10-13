/**
 * Write to dynamodb on status change
 */


'use strict';
var Status = require('./status.model');
var uuid = require('node-uuid');

exports.register = function(socket) {
  socket.on('status:change', function (status) {
    status.xid = uuid.v4();
    status.date = Date.now();
    Status.create(status, function (err) {
      if (err) console.log(err);
    });
    console.info('status:change xid:',status.xid, 'url:', status.url);
    socket.emit('status-accepted',status.xid);
  });
};
