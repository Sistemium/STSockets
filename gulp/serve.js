'use strict';

import gulp from 'gulp';
import nodemon from 'nodemon';
import runSequence from 'run-sequence';
import conf from './conf';
import gulpLoadPlugins from 'gulp-load-plugins';

const spawn = require('child_process').spawn;
const plugins = gulpLoadPlugins();

/********************
 * Helper functions
 ********************/

function onServerLog(log) {
  console.log(plugins.util.colors.white('[') +
    plugins.util.colors.yellow('nodemon') +
    plugins.util.colors.white('] ') +
    log.message);
}

gulp.task('start:server:prod', () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  conf.config = require(`../${conf.dist}/${conf.serverPath}/config/environment`);
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
  runSequence(
    ['clean:tmp'],
    ['lint:scripts'],
    ['env:all', 'start:server'],
    'watch',
    cb);
});

gulp.task('serve:dist', cb => {
  runSequence(
    'build',
    'env:all',
    'env:prod',
    'start:server:prod',
    cb);
});
