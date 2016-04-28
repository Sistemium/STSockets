'use strict';

import gulp from 'gulp';
import paths from './conf';
import {stream as wiredep} from 'wiredep';

// inject bower components
gulp.task('wiredep:client', () => {
  return gulp.src(paths.client.mainView)
    .pipe(wiredep({
      exclude: [
        /bootstrap-sass-official/,
        /[^-]bootstrap.js$/,
        /json3/,
        /es5-shim/,
        /bootstrap.css/,
        /font-awesome.css/
      ],
      ignorePath: paths.clientPath
    }))
    .pipe(gulp.dest(`${paths.clientPath}/`));
});

gulp.task('wiredep:test', () => {
  return gulp.src(paths.karma)
    .pipe(wiredep({
      exclude: [
        /bootstrap-sass-official/,
        /[^-]bootstrap.js/,
        '/json3/',
        '/es5-shim/',
        /bootstrap.css/,
        /font-awesome.css/
      ],
      devDependencies: true
    }))
    .pipe(gulp.dest('./'));
});
