'use strict';

var config = require('../../config/environment');
var request = require('request');

var tokens = {};

var _ = require('lodash');

var log401 = function (url,token) {
  console.error ('Not authorized token:', token, 'url:', url);
};

var debug = require ('debug') ('sts:auth');

var getRoles = function (token, callback) {

  var options = {
    url: config.pha.roles,
    headers: {
      'Authorization': token
    }
  };

  request(options, function (error, response, body) {

    if (error) {
      console.error(error);
      callback ();
    }

    if (response.statusCode === 200) {

      var roles = JSON.parse(body);
      console.log('Authorized token:', token, 'account:', roles.account.name);
      callback(roles);

    } else {

      // TODO: catch 401

      console.error ('Authorization error token:', token, 'status:', response.statusCode);
      callback (false);

    }

  });

};


module.exports = function (needRolesStringOrArray) {

  var needRoles = (typeof needRolesStringOrArray === 'string') ? [needRolesStringOrArray] : needRolesStringOrArray;

  return function (req, res, next) {

    if (req.method==='OPTIONS') {
      return next();
    }

    var token = req.headers.authorization;

    var onAuthorized = function (token) {

      if (!token.roles) {
        debug ('onAuthorized', 'no roles', token);
        return res.status (401).end ('No auth data');
      }

      var hasRole = !needRoles || _.reduce (needRoles,function(accumulator, role) {
        return accumulator || !!token.roles[role];
      },false);

      if (hasRole) {
        req.auth = token;
        next();
      } else {
        res.status(401).end('Need roles: ' + JSON.stringify(needRoles, null, 2));
      }
    };

    var onRoles = function (auth) {

      if (auth) {
        tokens[token] = auth;
        return onAuthorized (auth);
      }

      if (auth === false) {
        tokens[token] = false;
      }

      log401 (req.url, token);
      res.status(401).end('Not authorized')

    };

    if (!token || tokens[token] === false) {
      log401 (req.url, token);
      return res.status(401).end('Not authorized');
    }

    if (!tokens[token]) {
      return getRoles (token,onRoles);
    }

    onAuthorized (tokens[token]);

  };

};
