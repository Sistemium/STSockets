'use strict';

let config, isBuild;

const clientPath = require('../bower.json').appPath || 'client';
const serverPath = 'server';
export default {
  clientPath: clientPath,
  serverPath: serverPath,
  config: config,
  isBuild: isBuild,
  client: {
    assets: `${clientPath}/assets/**/*`,
    images: `${clientPath}/assets/images/**/*`,
    scripts: [
      `${clientPath}/**/!(*.spec|*.mock).js`,
      `!${clientPath}/bower_components/**/*`
    ],
    styles: [`${clientPath}/{app,components}/**/*.scss`],
    mainStyle: `${clientPath}/app/app.scss`,
    views: `${clientPath}/{app,components}/**/*.jade`,
    mainView: `${clientPath}/index.html`,
    test: [`${clientPath}/{app,components}/**/*.{spec,mock}.js`],
    e2e: ['e2e/**/*.spec.js'],
    bower: `${clientPath}/bower_components/`
  },
  server: {
    scripts: [`${serverPath}/**/!(*.spec|*.integration).js`],
    json: [`${serverPath}/**/*.json`],
    test: {
      integration: [`${serverPath}/**/*.integration.js`, 'mocha.global.js'],
      unit: [`${serverPath}/**/*.spec.js`, 'mocha.global.js']
    }
  },
  karma: 'karma.conf.js',
  dist: 'dist'
};
