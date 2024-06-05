import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
// @ts-ignore
import morgan from 'morgan';
// @ts-ignore
import compression from 'compression';
// @ts-ignore
import methodOverride from 'method-override';
// @ts-ignore
import errorHandler from 'errorhandler';
// @ts-ignore
import cors from 'cors';
import config from './environment';

export default function(app: any) {

  const env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(cors({
    allowedHeaders: [
      'Page-Size', 'Start-Page',
      'X-Page-Size', 'X-Start-Page',
      'X-Return-Post',
      'Authorization',
      'ETag', 'Content-Type'
    ],
    exposedHeaders: ['X-Aggregate-Count']
  }));
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.set('redisdb', config.redis.db);


  if ('production' === env) {
    //app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    // app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

};
