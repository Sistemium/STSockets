'use strict';

import gulp from 'gulp';
import nodemon from 'nodemon';
var spawn = require('child_process').spawn;
import runSequence from 'run-sequence';
import open from 'open';
import http from 'http';
import conf from './conf';
import gulpLoadPlugins from 'gulp-load-plugins';

let plugins = gulpLoadPlugins();

/********************
 * Helper functions
 ********************/

function onServerLog(log) {
  console.log(plugins.util.colors.white('[') +
    plugins.util.colors.yellow('nodemon') +
    plugins.util.colors.white('] ') +
    log.message);
}

function checkAppReady(cb) {
  var options = {
    host: 'localhost',
    port: conf.config.port
  };
  http
    .get(options, () => cb(true))
    .on('error', () => cb(false));
}

// Call page until first success
function whenServerReady(cb) {
  var serverReady = false;
  var appReadyInterval = setInterval(() =>
      checkAppReady((ready) => {
        if (!ready || serverReady) {
          return;
        }
        clearInterval(appReadyInterval);
        serverReady = true;
        cb();
      }),
    100);
}

gulp.task('start:client', cb => {
  whenServerReady(() => {
    open('http://localhost:' + conf.config.port);
    cb();
  });
});

gulp.task('start:server:prod', () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  conf.config = require(`./${conf.dist}/${conf.serverPath}/config/environment`);
  nodemon(`-w ${conf.dist}/${conf.serverPath} ${conf.dist}/${conf.serverPath}`)
    .on('log', onServerLog);
});

gulp.task('start:server', () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  conf.config = require(`../${conf.serverPath}/config/environment`);
  nodemon(`-w ${conf.serverPath} ${conf.serverPath}`)
    .on('log', onServerLog);
});

gulp.task('gulp-reload', function () {
  spawn('gulp', ['watch'], {stdio: 'inherit'});
  process.exit();
});

gulp.task('serve', cb => {
  runSequence(['clean:tmp', 'constant'],
    ['lint:scripts', 'inject', 'jade'],
    ['wiredep:client'],
    ['transpile:client', 'styles'],
    ['env:all', 'start:server', 'start:client'],
    'watch',
    cb);
});

gulp.task('serve:dist', cb => {
  runSequence(
    'build',
    'env:all',
    'env:prod',
    ['start:server:prod', 'start:client'],
    cb);
});
