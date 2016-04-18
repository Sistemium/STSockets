'use strict';

import gulp from 'gulp';
import paths from './conf';

gulp.task('copy:fonts', () => {
  return gulp.src(`${paths.clientPath}/bower_components/{bootstrap,font-awesome}/fonts/**/*`, {dot: true})
    .pipe(gulp.dest(`${paths.dist}/${paths.clientPath}/bower_components`));
});

gulp.task('copy:extras', () => {
  return gulp.src([
      `${paths.clientPath}/favicon.ico`,
      `${paths.clientPath}/robots.txt`,
      `${paths.clientPath}/.htaccess`
    ], {dot: true})
    .pipe(gulp.dest(`${paths.dist}/${paths.clientPath}`));
});

gulp.task('copy:assets', () => {
  return gulp.src([paths.client.assets, '!' + paths.client.images])
    .pipe(gulp.dest(`${paths.dist}/${paths.clientPath}/assets`));
});

gulp.task('copy:server', () => {
  return gulp.src([
      'package.json',
      'bower.json',
      '.bowerrc'
    ], {cwdbase: true})
    .pipe(gulp.dest(paths.dist));
});

