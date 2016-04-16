/**
 * Write to dynamodb on status change
 */


'use strict';
var Status = require('./status.model');
var uuid = require('node-uuid');

exports.register = function(socket) {

  socket.on('status:change', function (status, clientAck) {

    socket.lastStatus = status;
    socket.touch();

    var xid = uuid.v4();
    var ack = (typeof clientAck === 'function') ? clientAck : function () {};

    console.info ('status:change userId:', socket.userId, status.url, socket.id);

    if (socket.accessToken) {
      var rec = {
        token: socket.accessToken,
        date: Date.now(),
        userId: socket.userId,
        xid: xid,
        url: status.url
      };

      // Status.create(rec, function (err) {
      //   if (err) {
      //     console.error(err);
      //   }
      // });

      ack({xid: status.xid});

    } else {
      ack({error: 'not authorized'});
      console.error ('not authorized');
    }

  });

};
