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

gulp.task('lint:scripts', cb => runSequence(['lint:scripts:server'], cb));

gulp.task('lint:scripts:server', () => {
  return gulp.src(_.union(paths.server.scripts, _.map(paths.server.test, blob => '!' + blob)))
    .pipe(pipes.lintServerScripts());
});

gulp.task('lint:scripts:serverTest', () => {
  return gulp.src(paths.server.test)
    .pipe(pipes.lintServerTestScripts());
});

gulp.task('jscs', () => {
  return gulp.src(paths.server.scripts)
    .pipe(plugins.jscs())
    .pipe(plugins.jscs.reporter());
});
