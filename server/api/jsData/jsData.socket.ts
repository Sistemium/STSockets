import log from 'sistemium-debug';
import _ from 'lodash';
import * as uuid from 'uuid';
import router from './jsData.socket.router';
import when from 'when';
import * as jsDataModel from './jsData.model';
import config from '../../config/environment';


const { debug } = log('jsData:socket');
const { globalToken } = config;
const subscriptions: any[] = [];


export function emitEvent(method: string, resource: string, sourceSocketId?: string) {

  debug('emitEvent:', method, resource);

  return (data: any) => {

    let pool = _.head(resource.split('/'));

    let accessToken = globalToken(pool);

    if (!accessToken) {
      return emitToSubscribers(method, resource, sourceSocketId)(data);
    }

    const adminSocket = { accessToken };

    authorizedForData(data, adminSocket, method, resource)
      .then(emitToSubscribers(method, resource, sourceSocketId))
      .catch(err => {
        console.error(err);
      });

  };

}

function emitToSubscribers(method: string, resource: string, sourceSocketId?: string) {

  return (data: any) => {
    _.each(subscriptions, subscription => {

      if (!_.includes(subscription.filter, resource)) {
        return;
      }

      const pluginAuthorization = _.get(subscription, `socket.jsDataAuth.${resource}`);

      if (pluginAuthorization) {

        when(pluginAuthorization(subscription, method, data, resource))
          .then(authorized => {

            // debug('pluginAuthorization', subscription.socket.userId, method, resource, authorized);

            if (authorized === true) {
              return emitToSocket(subscription.socket, method, resource, sourceSocketId)(data);
            }

            if (authorized === false) {
              return;
            }

            authorizedForData(data, subscription.socket, method, resource)
              .then(emitToSocket(subscription.socket, method, resource, sourceSocketId))
              .catch(_.noop);

          });

      } else {

        authorizedForData(data, subscription.socket, method, resource)
          .then(emitToSocket(subscription.socket, method, resource, sourceSocketId))
          .catch(_.noop);

      }

    });
  }

}

function emitToSocket(socket: any, method: string, resource: string, sourceSocketId?: string) {

  return (data: any) => {
    const event = `jsData:${method}`;

    if (socket.id !== sourceSocketId) {
      debug('emitEvent:', event, 'id:', socket.id);
      socket.emit(event, {
        resource: resource,
        data: data
      });
    }
  }

}

function authorizedForData(data: any, socket: any, method: string, resource: string) {

  return new Promise((resolve, reject) => {

    let id = data.id;

    if (_.isEqual(method, 'update') && id) {

      let options = {
        headers: {
          authorization: socket.accessToken,
          'x-return-post': true,
          'user-agent': socket.userAgent || 'STSockets'
        },
        sourceSocketId: socket.id,
        authId: _.get(socket, 'account.authId')
      };

      return jsDataModel.find(resource, id, options)
        .then(resolve)
        .catch(reject);

    }

    return resolve(data);

  });

}

function unRegister(socket: any) {

  let toUnsubscribe = _.filter(subscriptions, { socket });

  debug('unRegister:', socket.id, 'subscriptions:', toUnsubscribe.length);

  _.each(toUnsubscribe, subscription => {
    _.remove(subscriptions, subscription);
  });

}

export function subscribe(socket: any) {

  return function (filter: Record<string, any>, callback?: any) {

    const subscription = {
      id: uuid.v4(),
      socket: socket,
      filter: filter
    };

    debug('jsData:subscribe', subscription.id, 'socket:', socket.id, 'filter:', filter);

    subscriptions.push(subscription);

    const result = { data: subscription.id };

    if (_.isFunction(callback)) return callback(result);

    return result;

  };

}

export function unSubscribe(socket: any) {
  return function (id: string, callback?: any) {

    const idx = _.findIndex(subscriptions, { id });
    let subscription;

    if (idx >= 0) {
      subscription = subscriptions [idx];
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'filter:', subscription.filter);
      subscriptions.splice(idx, 1);
    } else {
      debug('jsData:unsubscribe', id, 'socket:', socket.id, 'no subscription');
    }

    if (_.isFunction(callback)) {
      callback(subscription && subscription.id);
    }

  };
}


export function register(socket: any) {

  socket.on('jsData:subscribe', subscribe(socket));
  socket.on('jsData:unsubscribe', unSubscribe(socket));

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('jsData', (data: any, callback?: any) => {

    data.options = data.options || {};

    _.defaultsDeep(data.options, {
      headers: {
        authorization: socket.accessToken,
        'x-return-post': true,
        'user-agent': socket.userAgent
      },
      sourceSocketId: socket.id,
      authId: _.get(socket, 'account.authId')
    });

    if (socket.deviceUUID) {
      data.options.headers.deviceuuid = socket.deviceUUID;
      if (data.attrs) {
        data.attrs.deviceUUID = socket.deviceUUID;
      }
    }

    //debug('jsData event', data);

    router(data, callback);

  });

}
