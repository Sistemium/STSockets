'use strict';

module.exports = authenticator;

const request = require('request');
const _ = require('lodash');

const debug = require('debug')('sts:auth');
const config = require('../../config/environment');

const tokens = {};

function log401(url, token) {
  console.error('Not authorized token:', token, 'url:', url);
}


function getRoles(token, callback) {

  const options = {
    url: config.pha.roles,
    headers: {
      'Authorization': token
    }
  };

  request(options, function (error, response, body) {

    if (error) {
      console.error(error);
      callback();
    }

    if (response.statusCode === 200) {

      const roles = JSON.parse(body);
      console.log('Authorized token:', token, 'account:', roles.account.name);
      callback(roles);

    } else {

      // TODO: catch 401

      console.error('Authorization error token:', token, 'status:', response.statusCode);
      callback(false);

    }

  });

}


function authenticator(needRolesStringOrArray) {

  let needRoles = _.isString(needRolesStringOrArray) ? [needRolesStringOrArray] : needRolesStringOrArray;

  return function (req, res, next) {

    if (req.method === 'OPTIONS') {
      return next();
    }

    let token = req.headers.authorization;

    if (!token || tokens[token] === false) {
      log401(req.url, token);
      return res.status(401).end('Not authorized');
    }

    if (!tokens[token]) {
      return getRoles(token, onRoles);
    }

    onAuthorized(tokens[token]);


    function onAuthorized(auth) {

      if (!auth.roles) {
        debug('onAuthorized', 'no roles', auth);
        return res.status(401).end('No auth data');
      }

      let hasRole = !needRoles || _.reduce(needRoles, function (accumulator, role) {
          return accumulator || !!auth.roles[role];
        }, false);

      if (hasRole) {
        req.auth = auth;
        next();
      } else {
        res.status(401).end('Need roles: ' + JSON.stringify(needRoles, null, 2));
      }

    }


    function onRoles(auth) {

      if (auth) {
        tokens[token] = auth;
        return onAuthorized(auth);
      }

      if (auth === false) {
        tokens[token] = false;
      }

      log401(req.url, token);
      res.status(401).end('Not authorized')

    }

  };

}
