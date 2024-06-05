import log from 'sistemium-debug';

const { debug } = log('app');
import express from 'express';
import config from './config/environment';
import http from 'http';
// @ts-ignore
import socketIO from 'socket.io';
import routes from './routes';

// Setup server
const app = express();
const server = http.createServer(app);
const socket = socketIO(server, {
  serveClient: (config.env === 'production'),
  path: '/socket.io-client'
});
require('./config/socketio')(socket);
require('./config/express').default(app);
require('./config/redis').config(app);
require('./config/pluginLoader')();

routes(app);

function startServer() {
  server.listen(config.port, config.ip, function () {
    debug('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

export default app;
