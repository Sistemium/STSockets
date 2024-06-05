import authEmitter from './emitter';
// @ts-ignore
import request from 'request';
import _ from 'lodash';
import log from 'sistemium-debug';
import config from '../../config/environment';

const { debug } = log('auth');

const tokens: Record<string, any> = {};

function log401(url: string, token: string) {
  console.error('Not authorized token:', token, 'url:', url);
}

export async function authorizationForSocket(socket: any) {

  return new Promise((resolve, reject) => {

    return getRoles(socket, (auth: Record<string, any>) => {

      if (auth) {

        const { org, code, name } = auth.account;

        socket.org = org;
        socket.userId = code;

        _.assign(socket, _.pick(auth, ['account', 'roles', 'token']));

        socket.touch();

        debug('success:', `"${name}"`, `org:${org}`, `code:${code}`);

        authEmitter.emit(`${org}/auth`, socket);

      }

      if (auth || auth === false) {
        return resolve(auth);
      }

      reject('Authorization error');

    });

  });

}

function getRoles(socket: any, callback: any) {

  const { accessToken, deviceUUID, userAgent } = socket;

  const options = {
    url: config.pha.roles,
    headers: {
      'Authorization': accessToken,
      deviceUUID: deviceUUID,
      'user-agent': userAgent
    }
  };

  request(options, (error: any, response: any, body: any) => {

    if (error) {
      console.error(error);
      callback();
    }

    if (response.statusCode === 200) {

      const roles = JSON.parse(body);
      debug('Authorized token:', accessToken, 'account:', roles.account.name);
      callback(roles);

    } else {

      if (response.statusCode === 403) {

        console.error('Authorization error token:', accessToken, 'status:', response.statusCode);
        callback(false);

      } else {

        callback();

      }

    }

  });

}


export function authenticator(needRolesStringOrArray: string | string[]) {

  const needRoles = _.isString(needRolesStringOrArray) ? [needRolesStringOrArray] : needRolesStringOrArray;

  return function (req: any, res: any, next: any) {

    if (req.method === 'OPTIONS') {
      return next();
    }

    let token = req.headers.authorization;

    if (!token || tokens[token] === false) {
      log401(req.url, token);
      return res.status(401).end('Not authorized');
    }

    if (!tokens[token]) {
      return getRoles({ accessToken: token }, onRoles);
    }

    onAuthorized(tokens[token]);


    function onAuthorized(auth: Record<string, any>) {

      if (!auth.roles) {
        debug('onAuthorized', 'no roles', auth);
        return res.status(401).end('No auth data');
      }

      const hasRole = !needRoles || _.reduce(needRoles, function (accumulator, role) {
        return accumulator || !!auth.roles[role];
      }, false);

      if (hasRole) {
        req.auth = auth;
        next();
      } else {
        res.status(401).end('Need roles: ' + JSON.stringify(needRoles, null, 2));
      }

    }


    function onRoles(auth: Record<string, any>) {

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

export function authorizedForSocketChange(socket: any, changedSocket: any) {

  return socket.roles.socketAdmin === '*'
    || socket.roles.socketAdmin === changedSocket.org
    || socket.org === changedSocket.org;

}
