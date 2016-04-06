'use strict';

var redis = require ('redis');
var config = require ('./environment');
var bluebird = require ('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);

// TODO: respect connect and disconnect errors
var redisClient = redis.createClient(config.redisConfig);

exports.redisClient = redisClient;

exports.hsetAsync = function (hashName, key, value) {
  return redisClient.hsetAsync(hashName, key, JSON.stringify(value));
};

exports.hgetAsync = function (hashName, key) {
  return redisClient.hgetAsync(hashName, key).then((res) => {
    return JSON.parse(res);
  });
};
