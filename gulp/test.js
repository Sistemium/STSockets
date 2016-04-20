'use strict';

import gulp from 'gulp';
import paths from './conf';
import {protractor, webdriver_update} from 'gulp-protractor';
import {Server as KarmaServer} from 'karma';
import pipes from './reusablePipelines';
import runSequence from 'run-sequence';

gulp.task('test:e2e', ['env:all', 'env:test', 'start:server', 'webdriver_update'], cb => {
  gulp.src(paths.client.e2e)
    .pipe(protractor({
      configFile: 'protractor.conf.js'
    })).on('error', err => {
    console.log(err)
  }).on('end', () => {
    process.exit();
  });
});

gulp.task('test:client', ['wiredep:test', 'constant'], (done) => {
  new KarmaServer({
    configFile: `${__dirname}/${paths.karma}`,
    singleRun: false
  }, function () {
    done();
  }).start();
});

gulp.task('test', cb => {
  return runSequence('test:server', 'test:client', cb);
});

gulp.task('test:server', cb => {
  runSequence(
    'env:all',
    'env:test',
    'mocha:unit',
    //'mocha:integration',
    'mocha:coverage',
    cb);
});

gulp.task('mocha:unit', () => {
  return gulp.src(paths.server.test.unit)
    .pipe(pipes.mocha());
});

gulp.task('mocha:integration', () => {
  return gulp.src(paths.server.test.integration)
    .pipe(pipes.mocha());
});

// Downloads the selenium webdriver
gulp.task('webdriver_update', webdriver_update);
