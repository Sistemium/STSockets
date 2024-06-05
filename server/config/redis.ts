// @ts-ignore
import redis from 'redis';
import env from './environment';
// @ts-ignore
import bluebird from 'bluebird';
import log from 'sistemium-debug';

const { debug } = log('redis');

bluebird.promisifyAll(redis.RedisClient.prototype);

debug('Redis config:', env.redis);

export const redisClient = redis.createClient(env.redis);

redisClient.on('ready', function () {
  debug('Redis client connection is established.');
});

redisClient.on('error', function (err: any) {
  debug('Error in redis client encountered', err.message);
});

redisClient.on('end', function () {
  debug('Redis server connection has closed');
});

export function hsetAsync(hashName: string, key: string, value: any) {
  return redisClient.hsetAsync(hashName, key, JSON.stringify(value));
}

export function hgetAsync(hashName: string, key: string) {
  return redisClient.hgetAsync(hashName, key).then((res: any) => {
    return JSON.parse(res);
  });
}

export function hdelAsync(hashName: string, key: string) {
  return redisClient.hdelAsync(hashName, key);
}

export function delAsync(hashName: string) {
  return redisClient.delAsync(hashName);
}

export function config(app: any) {
  redisClient.select(app.get('redisdb'), (err: any) => {
    if (err) throw new Error(err);
    debug('Redis client connected to db %s', app.get('redisdb'));
  });

  return redisClient;
}
