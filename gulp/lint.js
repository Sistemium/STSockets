'use strict';
import gulp from 'gulp';
import paths from './conf';
import pipes from './reusablePipelines';
import gulpLoadPlugins from 'gulp-load-plugins';
import _ from 'lodash';
import runSequence from 'run-sequence';

let plugins = gulpLoadPlugins();

/*****************
 * Lint tasks
 *****************/

gulp.task('lint:scripts', cb => runSequence(['lint:scripts:client', 'lint:scripts:server'], cb));

gulp.task('lint:scripts:client', () => {
  return gulp.src(_.union(
    paths.client.scripts,
    _.map(paths.client.test, blob => '!' + blob),
    [`!${paths.clientPath}/app/app.constant.js`]
    ))
    .pipe(pipes.lintClientScripts());
});

gulp.task('lint:scripts:server', () => {
  return gulp.src(_.union(paths.server.scripts, _.map(paths.server.test, blob => '!' + blob)))
    .pipe(pipes.lintServerScripts());
});

gulp.task('lint:scripts:clientTest', () => {
  return gulp.src(paths.client.test)
    .pipe(pipes.lintClientScripts());
});

gulp.task('lint:scripts:serverTest', () => {
  return gulp.src(paths.server.test)
    .pipe(pipes.lintServerTestScripts());
});

gulp.task('jscs', () => {
  return gulp.src(_.union(paths.client.scripts, paths.server.scripts))
    .pipe(plugins.jscs())
    .pipe(plugins.jscs.reporter());
});
