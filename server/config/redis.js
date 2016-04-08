'use strict';

var redis = require ('redis');
var config = require ('./environment');
var bluebird = require ('bluebird');
var debug = require ('debug')('sts:redis');

bluebird.promisifyAll(redis.RedisClient.prototype);

var redisClient = redis.createClient(config.redisConfig);

redisClient.on('ready', function () {
  debug('Redis client connection is established.');
});

redisClient.on('error', function () {
  debug('Error in redis client encountered');
});

redisClient.on('end', function () {
  debug('Redis server connection has closed');
});

exports.redisClient = redisClient;

exports.hsetAsync = function (hashName, key, value) {
  return redisClient.hsetAsync(hashName, key, JSON.stringify(value));
};

exports.hgetAsync = function (hashName, key) {
  return redisClient.hgetAsync(hashName, key).then((res) => {
    return JSON.parse(res);
  });
};

exports.config = function (app) {
  redisClient.select(app.get('redisdb'), function (err) {
    if (err) throw new Error(err);
    console.log('Redis client connected to db %s', app.get('redisdb'));
  });

  return redisClient;
};
