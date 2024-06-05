// @ts-ignore
import request from 'request';
import _ from 'lodash';
import config from '../../config/environment';

const apiV3 = config.APIv3;

const db: Record<string, any> = {};

export function get(request: any, socket: any) {

  return new Promise((resolve, reject) => {
    getEntityData(request, socket).then(resolve, reject);
  });

}

function getEntityData(req: any, socket: any) {

  const entity = req.entity;
  const { accessToken: token, userAgent, deviceUUID, org } = socket

  const options = {
    url: `${apiV3 + org}/${entity}`,
    headers: {
      authorization: token,
      deviceUUID: deviceUUID,
      'user-agent': userAgent,
      'if-none-match': '*',
      'page-size': '500',
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    },
    qs: req.params
  };

  console.info('SAPIV3 getEntityData entity:', entity);

  return new Promise((resolve, reject) => {

    let storedEntity = db[entity];

    if (!storedEntity) {
      storedEntity = db[entity] = {
        etag: '*',
        data: []
      };
    }

    request.get(options, onResponse);

    function onResponse(err: any, res: any, body: any) {

      let jsonBody;

      if (err) {
        console.error(err);
      }

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (jsonBody && jsonBody.length && res.statusCode === 200) {
        console.info('st-api-v3.getEntityData got count:', jsonBody.length, 'ETag:', res.headers.etag);
        storedEntity.data = _.uniqBy(_.union(jsonBody, storedEntity.data), 'id');

        if (res.headers.etag) {
          options.headers ['if-none-match'] = (storedEntity.etag = res.headers.etag);
          return request.get(options, onResponse);
        }
        resolve(storedEntity.data);
      } else if (res.statusCode === 204) {
        console.info('st-api-v3.getEntityData final count:', storedEntity.data.length);
        console.info('st-api-v3.getEntityData final sample:', _.first(storedEntity.data));
        resolve(storedEntity.data);
      } else {
        console.error('st-api-v3.getEntityData error:', res.statusCode);
        reject();
      }

    }

  });

}
