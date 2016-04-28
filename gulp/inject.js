'use strict';

import gulp from 'gulp';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';
import paths from './conf';
import _ from 'lodash';

let plugins = gulpLoadPlugins();

/*******************
 * Inject
 *******************/

function sortModulesFirst(a, b) {
  var module = /\.module\.js$/;
  var aMod = module.test(a.path);
  var bMod = module.test(b.path);
  // inject *.module.js first
  if (aMod === bMod) {
    // either both modules or both non-modules, so just sort normally
    if (a.path < b.path) {
      return -1;
    }
    if (a.path > b.path) {
      return 1;
    }
    return 0;
  } else {
    return (aMod ? -1 : 1);
  }
}

gulp.task('inject', cb => {
  runSequence(['inject:js', 'inject:css', 'inject:scss'], cb);
});

gulp.task('inject:js', () => {
  return gulp.src(paths.client.mainView)
    .pipe(plugins.inject(
      gulp.src(_.union(paths.client.scripts, [`!${paths.clientPath}/**/*.{spec,mock}.js`, `!${paths.clientPath}/app/app.js`]), {read: false})
        .pipe(plugins.sort(sortModulesFirst)),
      {
        starttag: '<!-- injector:js -->',
        endtag: '<!-- endinjector -->',
        transform: (filepath) => '<script src="' + filepath.replace(`/${paths.clientPath}/`, '') + '"></script>'
      }))
    .pipe(gulp.dest(paths.clientPath));
});

gulp.task('inject:css', () => {
  return gulp.src(paths.client.mainView)
    .pipe(plugins.inject(
      gulp.src(`/${paths.clientPath}/{app,components}/**/*.css`, {read: false})
        .pipe(plugins.sort()),
      {
        starttag: '<!-- injector:css -->',
        endtag: '<!-- endinjector -->',
        transform: (filepath) => '<link rel="stylesheet" href="' + filepath.replace(`/${paths.clientPath}/`, '').replace('/.tmp/', '') + '">'
      }))
    .pipe(gulp.dest(paths.clientPath));
});

gulp.task('inject:scss', () => {
  return gulp.src(paths.client.mainStyle)
    .pipe(plugins.inject(
      gulp.src(_.union(paths.client.styles, ['!' + paths.client.mainStyle]), {read: false})
        .pipe(plugins.sort()),
      {
        starttag: '// injector',
        endtag: '// endinjector',
        transform: (filepath) => {
          let newPath = filepath
            .replace(`/${paths.clientPath}/app/`, '')
            .replace(`/${paths.clientPath}/components/`, '../components/')
            .replace(/_(.*).scss/, (match, p1, offset, string) => p1)
            .replace('.scss', '');
          return `@import '${newPath}';`;
        }
      }))
    .pipe(gulp.dest(`${paths.clientPath}/app`));
});
