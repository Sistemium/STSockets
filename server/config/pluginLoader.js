/**
 * Created by edgarjanvuicik on 11/07/2017.
 */

module.exports = loader;

const config = require('./environment');
const pluginsDir = config.plugins;
const fs = require('fs');
const jsDataModel = require('../api/jsData/jsData.model');
const emitter = require('../components/auth/emitter');

function loader() {

  if (!pluginsDir) return;

  let context = {
    jsDataModel,
    emitter,
    config
  };

  fs.readdirSync(pluginsDir)
    .forEach(file => {
      require(`${pluginsDir}/${file}`)(context);
    })

}
