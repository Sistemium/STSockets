function requiredProcessEnv(name: string) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

function processEnv(name: string) {
  return process.env[name];
}

export default {

  port: requiredProcessEnv('PORT'),

  APIv4: requiredProcessEnv('APIv4'),
  APIv1: processEnv('APIv1'),
  APIv3: processEnv('APIv3')

}
