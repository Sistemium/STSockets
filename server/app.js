/**
 * Main application file
 */

'use strict';

// Set default node environment to development
require('debug').log = console.info.bind(console);

const express = require('express');
const config = require('./config/environment');
// const dynamoose = require('dynamoose');
import http from 'http';

//dynamodb configuration
// dynamoose.defaults.waitForActiveTimeout = 100;
// dynamoose.AWS.config.update({
//   accessKeyId: config.AWS.accessKeyId,
//   secretAccessKey: config.AWS.secretAccessKey,
//   region: config.AWS.region
// });

// Setup server
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production'),
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./config/redis').config(app);
require('./routes')(app);

// Start server
function startServer() {
  app.stsockets = server.listen(config.port, config.ip, function () {
    console.info('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

// Expose app
export default app;
