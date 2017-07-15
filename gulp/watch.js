'use strict';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import _ from 'lodash';
import pipes from './reusablePipelines';
import paths from './conf';

let plugins = gulpLoadPlugins();

gulp.task('watch', () => {

  const testFiles = _.union(paths.server.test.unit, paths.server.test.integration);

  plugins.watch(_.union(paths.server.scripts, testFiles))
    .pipe(plugins.plumber())
    .pipe(pipes.lintServerScripts());

  gulp.watch('gulpfile.js', ['gulp-reload']);

});
