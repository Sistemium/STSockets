'use strict';

import gulp from 'gulp';
import conf from './conf';
import gulpLoadPlugins from 'gulp-load-plugins';
import pipes from './reusablePipelines';
import del from 'del';
import _ from 'lodash';

let plugins = gulpLoadPlugins();

/********************
 * Build
 ********************/

gulp.task('build', cb => {
  conf.isBuild = true;

  runSequence([
      'clean:dist',
      'clean:tmp'
    ],
    'jade',
    'inject',
    'wiredep:client',
    [
      'build:images',
      'copy:extras',
      'copy:fonts',
      'copy:assets',
      'copy:server',
      'transpile:server',
      'build:client'
    ],
    cb);
});

gulp.task('clean:dist', () => del([`${conf.dist}/!(.git*|.openshift|Procfile)**`], {dot: true}));



gulp.task('html', function () {
  return gulp.src(`${clientPath}/{app,components}/**/*.jade`)
    .pipe(plugins.jade({pretty: true}))
    .pipe(plugins.angularTemplatecache({
      module: 'authApiApp'
    }))
    .pipe(gulp.dest('.tmp'));
});
gulp.task('jade', function () {
  gulp.src(conf.client.views)
    .pipe(plugins.jade())
    .pipe(gulp.dest('.tmp'));
});




gulp.task('build:client', ['transpile:client', 'styles', 'html', 'constant'], () => {
  var manifest = gulp.src(`${conf.dist}/${conf.clientPath}/assets/rev-manifest.json`);

  var appFilter = plugins.filter('**/app.js');
  var jsFilter = plugins.filter('**/*.js');
  var cssFilter = plugins.filter('**/*.css');
  var htmlBlock = plugins.filter(['**/*.!(html)']);
  var assetsFilter = plugins.filter('**/*.{js,css}');

  return gulp.src(conf.client.mainView)
    //.pipe(plugins.html2jade({nspaces:2}))
    //.pipe(plugins.jade({pretty: true}))
    .pipe(plugins.useref())
    .pipe(appFilter)
    .pipe(plugins.addSrc.append('.tmp/templates.js'))
    .pipe(plugins.concat('app/app.js'))
    .pipe(appFilter.restore())
    .pipe(jsFilter)
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe(plugins.minifyCss({
      cache: true,
      processImportFrom: ['!fonts.googleapis.com']
    }))
    .pipe(cssFilter.restore())
    .pipe(htmlBlock)
    .pipe(plugins.rev())
    .pipe(htmlBlock.restore())
    .pipe(plugins.revReplace({manifest}))
    .pipe(assetsFilter)
    .pipe(assetsFilter.restore())
    .pipe(gulp.dest(`${conf.dist}/${conf.clientPath}`));
});

gulp.task('build:images', () => {
  return gulp.src(conf.client.images)
    .pipe(plugins.imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true
    }))
    .pipe(plugins.rev())
    .pipe(gulp.dest(`${conf.dist}/${conf.clientPath}/assets/images`))
    .pipe(plugins.rev.manifest(`${conf.dist}/${conf.clientPath}/assets/rev-manifest.json`, {
      base: `${conf.dist}/${conf.clientPath}/assets`,
      merge: true
    }))
    .pipe(gulp.dest(`${conf.dist}/${conf.clientPath}/assets`));
});

gulp.task('styles', () => {
  return gulp.src(conf.client.mainStyle)
    .pipe(pipes.styles())
    .pipe(gulp.dest('.tmp/app'));
});

gulp.task('transpile:client', () => {
  return gulp.src(conf.client.scripts)
    .pipe(pipes.transpileClient())
    .pipe(gulp.dest('.tmp'));
});

gulp.task('transpile:server', () => {
  return gulp.src(_.union(conf.server.scripts, conf.server.json))
    .pipe(pipes.transpileServer())
    .pipe(gulp.dest(`${conf.dist}/${conf.serverPath}`));
});

gulp.task('clean:tmp', () => del(['.tmp/**/*'], {dot: true}));


