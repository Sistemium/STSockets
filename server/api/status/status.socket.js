/**
 * Write to dynamodb on status change
 */


'use strict';
var Status = require('./status.model');

exports.register = function(socket) {
  socket.on('status:change', function (data) {
    Status.create(data, function (err) {
      if (err) console.log(err);
    })
  });
};
