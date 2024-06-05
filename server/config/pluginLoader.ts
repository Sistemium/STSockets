/**
 * Created by edgar jan vuicik on 11/07/2017.
 */

import config from './environment';
import fs from 'fs';
import * as jsDataModel from '../api/jsData/jsData.model';
import emitter from '../components/auth/emitter';
const pluginsDir = config.plugins;

export default function() {

  if (!pluginsDir) return;

  const context = {
    jsDataModel,
    emitter,
    config
  };

  fs.readdirSync(pluginsDir)
    .forEach(file => {
      require(`${pluginsDir}/${file}`)(context);
    })

}
