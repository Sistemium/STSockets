/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('debug').log = console.info.bind(console);

var express = require('express');
var config = require('./config/environment');
var dynamoose = require('dynamoose');

//dynamodb configuration
dynamoose.defaults.waitForActiveTimeout = 100;
dynamoose.AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production'),
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./config/redis').config(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.info('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
