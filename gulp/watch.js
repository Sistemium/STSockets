'use strict';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import _ from 'lodash';
import pipes from './reusablePipelines';
import paths from './conf';

let plugins = gulpLoadPlugins();

gulp.task('watch', () => {
  var testFiles = _.union(paths.client.test, paths.server.test.unit, paths.server.test.integration);

  plugins.livereload.listen({
    port: process.env.LIVERELOAD_PORT || 35729
  });

  plugins.watch(paths.client.styles, () => {  //['inject:scss']
    gulp.src(paths.client.mainStyle)
      .pipe(plugins.plumber())
      .pipe(pipes.styles())
      .pipe(gulp.dest('.tmp/app'))
      .pipe(plugins.livereload());
  });

  plugins.watch(paths.client.views)
    .pipe(plugins.plumber())
    .pipe(plugins.jade({pretty: true}))
    .pipe(gulp.dest('.tmp'))
    .pipe(plugins.livereload());

  plugins.watch(paths.client.scripts) //['inject:js']
    .pipe(plugins.plumber())
    .pipe(pipes.transpileClient())
    .pipe(gulp.dest('.tmp'))
    .pipe(plugins.livereload());

  plugins.watch(_.union(paths.server.scripts, testFiles))
    .pipe(plugins.plumber())
    .pipe(pipes.lintServerScripts())
    .pipe(plugins.livereload());

  gulp.watch('bower.json', ['wiredep:client']);
  gulp.watch('gulpfile.js', ['gulp-reload']);
});
