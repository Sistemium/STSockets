import events from 'events';
import _ from 'lodash';
// @ts-ignore
import request from 'request';
import * as v3 from './st-api-v3';
import config from '../../config/environment';

const sockets: any[] = [];
const apiV1 = config.APIv1;
const apiV3 = config.APIv3;

const eventEmitter = new events.EventEmitter();
const liveSearchData: Record<string, any> = {};

eventEmitter.on('api:data', function (data) {
  sockets.every(() => {
    console.info('api:data:', data);
  });
});


export function register(socket: any) {
  sockets.push(socket);
  doRegister(socket);
}


function unRegister(socket: any) {
  const idx = sockets.indexOf(socket);
  if (idx > -1) {
    sockets.splice(idx, 1);
  }
}

function postApi(data: any, socket: any, callback: any) {

  const {
    accessToken: auth,
    userAgent,
    deviceUUID,
    org,
  } = socket;

  const options = {
    url: apiV1 + org,
    json: data,
    headers: {
      authorization: auth,
      deviceUUID: deviceUUID,
      'user-agent': userAgent,
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    }
  };

  return request.post(options, (err: any, res: any, body: any) => {
    callback(body);
  });

}

function getLiveSearchData(entity: string, socket: any) {

  const {
    accessToken: token,
    userAgent,
    deviceUUID,
    org,
  } = socket;

  const options = {
    url: `${apiV3}${org}/${entity}`,
    headers: {
      authorization: token,
      deviceUUID,
      'user-agent': userAgent,
      'if-none-match': '*',
      'page-size': '500',
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    }
  };

  return new Promise((resolve, reject) => {

    const lsd = liveSearchData [entity];

    request.get(options, onResponse);

    function onResponse(err: any, res: any, body: any) {

      let jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (jsonBody && res.statusCode === 200) {
        console.info('getLiveSearchData count:', jsonBody.length, res.headers.etag);
        lsd.store = _.union(lsd.store || [], jsonBody);

        if (res.headers.etag) {
          options.headers ['if-none-match'] = (lsd.etag = res.headers.etag);
          return request.get(options, onResponse);
        }
        resolve(lsd.store);
      } else if (res.statusCode === 400) {
        lsd.store = [];
        resolve(lsd.store);
      } else if (res.statusCode === 204) {
        lsd.store = _.sortBy(_.uniqBy(lsd.store, 'id'), 'name');
        console.info('getLiveSearchData final count:', lsd.store.length);
        console.info('getLiveSearchData final sample:', _.first(lsd.store));
        resolve(lsd.store);
      } else {
        console.error('getLiveSearchData error:', res.statusCode);
        reject();
      }

      liveSearchData[entity].busy = false;

    }

  })

}

interface ILiveSearch {
  limit?: number
  entity: string
  searchText: string
  columns: string[]
}

function liveSearchBy(query: ILiveSearch, socket: any, callback: any) {

  const entity = query.entity;
  let entityData = liveSearchData[entity];
  const limit = query.limit || 50;

  if (!entityData) {
    entityData = (liveSearchData [entity] = {});
    liveSearchData[entity].busy = getLiveSearchData(entity, socket);
  }

  if (entityData.busy) {
    entityData.busy.then(() => {
      liveSearchBy(query, socket, callback);
    });
  } else {

    const re = new RegExp(query.searchText, 'ig');
    const matches = _.filter(entityData.store, (e) => {
      return e.name && e.name.match(re);
    });

    console.log('liveSearchBy matches:', matches.length,
      'of', entityData.store ? entityData.store.length : 0,
      'for:', re
    );
    socket.touch();
    callback(_.map(_.take(matches, limit), (item) => {
      return _.pick(item, query.columns);
    }));

  }

}

function doRegister(socket: any) {

  socket.on('disconnect', function () {
    unRegister(socket);
  });

  socket.on('data:v1', (data: any, clientAck: any) => {

    const ack = (typeof clientAck === 'function') ? clientAck : _.noop;

    socket.touch();

    console.info('data:v1', 'id:', socket.id, 'ack:', !!ack, 'payload:', (JSON.stringify(data) || '').length);

    postApi(data, socket, ack)
      .on('response', () => {
        socket.touch()
      });

  });

  socket.on('livesearch', (data: any, clientAck: any) => {

    let ack = (typeof clientAck === 'function') ? clientAck : _.noop;
    socket.touch();

    console.info('livesearch', 'id:', socket.id, 'query:', JSON.stringify(data, null, 2));

    liveSearchBy(data, socket, ack);

  });

  socket.on('get:v3', (request: any, clientAck?: any) => {

    let ack = (typeof clientAck === 'function') ? clientAck : _.noop;

    socket.touch();

    console.info('data:v3', 'id:', socket.id, 'query:', JSON.stringify(request, null, 2));

    v3.get(request, socket)
      .then(ack);

  });

}
