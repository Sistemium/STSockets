'use strict';
let request = require('request');
let deepMixIn = require('mout/object/deepMixIn');
let DSUtils = require('js-data').DSUtils;
let _ = require('lodash');

function Defaults() {

}

function makeRequest(options, resolve, reject) {

  request(options, function (error, response, body) {
    if (error) {
      console.error('Error occurred:', error);
      return reject();
    }

    if (response.statusCode === 404) {
      return reject(404);
    }

    return resolve(JSON.parse(body));
  });

}

Defaults.prototype.queryTransform = function (resourceName, params) {
  return params;
};

function MyCustomAdapter(options) {
  options || (options = {});
  this.defaults = new Defaults();
  deepMixIn(this.defaults, options);
}

// All of the methods shown here must return a promise

// "definition" is a resource defintion that would
// be returned by DS#defineResource

// "options" would be the options argument that
// was passed into the DS method that is calling
// the adapter method

MyCustomAdapter.prototype.create = function (definition, attrs, options) {
  // Must return a promise that resolves with the created item
};

MyCustomAdapter.prototype.find = function (definition, id, options) {
  // Must return a promise that resolves with the found item
  let self = this;
  options || (options = {});

  return new DSUtils.Promise(function (resolve, reject) {
    let opts = _.extend({
      url: self.defaults.url + definition.endpoint + '/' + id,
      method: 'GET'
    }, options);

    makeRequest(opts, resolve, reject);
  });

};

MyCustomAdapter.prototype.findAll = function (definition, params, options) {
  // Must return a promise that resolves with the found items
  let self = this;
  options || (options = {});
  return new DSUtils.Promise(function (resolve, reject) {

    let opts = _.extend({
      url: self.defaults.url + definition.endpoint,
      method: 'GET'
    }, options);

    makeRequest(opts, resolve, reject);
  });
};

MyCustomAdapter.prototype.update = function (definition, id, attrs, options) {
  // Must return a promise that resolves with the updated item
};

MyCustomAdapter.prototype.updateAll = function (definition, attrs, params, options) {
  // Must return a promise that resolves with the updated items
};

MyCustomAdapter.prototype.destroy = function (definition, id, options) {
  // Must return a promise
};

MyCustomAdapter.prototype.destroyAll = function (definition, params, options) {
  // Must return a promise
};

module.exports = MyCustomAdapter;
