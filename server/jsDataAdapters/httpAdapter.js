'use strict';
var request = require('request');
var deepMixIn = require('mout/object/deepMixIn');
var DSUtils = require('js-data').DSUtils;

function Defaults() {

}

Defaults.prototype.queryTransform = function (resourceName, params) {
  return params;
};

function MyCustomAdapter(options) {
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
};

MyCustomAdapter.prototype.findAll = function (definition, params, options) {
  // Must return a promise that resolves with the found items
  var self = this;
  return new DSUtils.Promise(function (resolve, reject) {

    var options = {
      url: self.defaults.url + definition.endpoint,
      method: 'GET'
    };

    request(options, function (error, response, body) {
      if (error) {
        console.error('Error occurred:', error);
        return reject();
      }

      return resolve(JSON.parse(body));
    });
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
