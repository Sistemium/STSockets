import path from 'path';
import _ from 'lodash';


const all: Record<string, any> = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 8000,


  headers: [
    'authorization',
    'x-page-size',
    'x-return-post',
    'x-start-page',
    'user-agent',
    'deviceuuid'
  ],

  AWS: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    expireAfter: process.env.REDIS_EXPIRE_AFTER || 30,
    db: process.env.REDIS_DATABASE || 0
  },

  apiV4(resource: string) {

    if (!resource) {
      console.error('apiV4 empty resource');
      return false;
    }

    let org = resource.match(/(^[^\/]*)\/(.*)/);
    let key = 'APIv4';
    let orgKey = key + (org ? '_' + org[1] : '');

    if (org && this[orgKey]) {
      return this[orgKey] + org [2];
    }

    return this[key] + resource;

  },

  pha: {
    roles: process.env.PHA_ROLES || 'https://api.sistemium.com/pha/roles'
  },

  api: {
    adminRoles: process.env.API_ADMIN_ROLES || 'admin'
  },

  plugins: process.env.PLUGINS_PATH,

  globalToken(pool: string) {
    let key = `${pool.toUpperCase()}_AUTH`;
    return process.env[key] || false;
  },

};

_.each(process.env, (val: any, key: string) => {

  if (/APIv\d.*/.test(key)) {
    all [key] = val;
  }

});


const config: Record<string, any> = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});

console.log('Config:', config);

export default config
