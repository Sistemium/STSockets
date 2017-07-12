/**
 * Created by edgarjanvuicik on 11/07/2017.
 */

module.exports = loader;

const config = require('./environment');
const pluginsDir = config.plugins;
const root = config.root;
const fs = require('fs');

function loader() {

  fs.readdirSync(root+pluginsDir).forEach(file => {
    require(root+pluginsDir + '/' + file)();
  })

}
