/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  app.use('/api/drivers', require('./api/driver'));
  app.use('/api/remoteCommands', require('./api/remoteCommands'));
  app.use('/api/sockets', require('./api/session'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

};
