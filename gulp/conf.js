'use strict';

const serverPath = 'server';

export default {

  serverPath: serverPath,
  config: null,
  isBuild: null,

  karma: '../karma.conf.js',
  dist: 'dist',

  server: {

    scripts: [`${serverPath}/**/!(*.spec|*.integration).js`],
    json: [`${serverPath}/**/*.json`],

    test: {
      integration: [`${serverPath}/**/*.integration.js`, 'mocha.global.js'],
      unit: [`${serverPath}/**/*.spec.js`, 'mocha.global.js']
    }

  }

};
