import log from 'sistemium-debug';

const { debug } = log('app');
import express from 'express';
import config from './config/environment';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';

// Setup server
const app = express();
const httpServer = createServer(app);
const origin = [
  /(.*\.)?sistemium\.(com|ru)$/,
  /localhost:\d{4}/,
  config.domain && new RegExp(config.domain),
].filter(x => x)

const socket = new Server(httpServer, {
  serveClient: false,
  path: '/socket.io-client',
  allowEIO3: true,
  cors: {
    origin,
    methods: ['GET', 'POST'],
    credentials: true
  },
});
require('./config/socketio').default(socket);
require('./config/express').default(app);
require('./config/pluginLoader').default();

routes(app);

function startServer() {
  httpServer.listen(config.port, config.ip, () => {
    debug('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

setImmediate(startServer);

export default app;
