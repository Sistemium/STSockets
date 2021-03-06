'use strict';

import lazypipe from 'lazypipe';
import gulpLoadPlugins from 'gulp-load-plugins';
import paths from './conf';

let plugins = gulpLoadPlugins();

/********************
 * Reusable pipelines
 ********************/

export default {

  lintServerScripts: lazypipe()
    .pipe(plugins.jshint, `${paths.serverPath}/.jshintrc`)
    .pipe(plugins.jshint.reporter, 'jshint-stylish'),

  lintServerTestScripts: lazypipe()
    .pipe(plugins.jshint, `${paths.serverPath}/.jshintrc-spec`)
    .pipe(plugins.jshint.reporter, 'jshint-stylish'),

  transpileServer: lazypipe()
    // .pipe(plugins.sourcemaps.init)
    .pipe(plugins.babel, {
      optional: ['runtime']
    })
    .pipe(plugins.sourcemaps.write, '.'),

  mocha: lazypipe()
    .pipe(plugins.mocha, {
      reporter: 'spec',
      timeout: 5000,
      require: [
        './mocha.conf'
      ]
    }),

  istanbul: lazypipe()
    .pipe(plugins.istanbul.writeReports)
    .pipe(plugins.istanbulEnforcer, {
      thresholds: {
        global: {
          lines: 80,
          statements: 80,
          branches: 80,
          functions: 80
        }
      },
      coverageDirectory: './coverage',
      rootDirectory: ''
    })
};
