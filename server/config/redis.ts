import * as redis from 'sistemium-redis';
import log from 'sistemium-debug';
import env from './environment';

const { debug } = log('redis');

debug('Redis config:', JSON.stringify(env.redis));

export const redisClient = redis.client;

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
  return redis.hsetAsync(hashName, key, JSON.stringify(value));
}

export function hgetAsync(hashName: string, key: string) {
  return redis.hgetAsync(hashName, key).then((res: any) => {
    return JSON.parse(res);
  });
}

export function hdelAsync(hashName: string, key: string) {
  return redis.hdelAsync(hashName, key);
}

export function delAsync(hashName: string) {
  return redis.delAsync(hashName);
}

export function config(app: any) {
  redisClient.select(app.get('redisdb'), (err: any) => {
    if (err) throw new Error(err);
    debug('Redis client connected to db %s', app.get('redisdb'));
  });

  return redisClient;
}
