'use strict';

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

module.exports = {

  port: requiredProcessEnv('PORT'),

  APIv4: requiredProcessEnv('APIv4'),
  APIv1: requiredProcessEnv('APIv1'),
  APIv3: requiredProcessEnv('APIv3')

};
