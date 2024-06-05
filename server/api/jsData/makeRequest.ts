// @ts-ignore
import request from 'request';
import log from 'sistemium-debug';
import _ from 'lodash';

const { debug } = log('makeRequest');
const noCacheRe = /no-cache/i;

export default function makeRequest(options: Record<string, any>, resolve: any, reject: any) {

  let result;

  const requestOptions = {
    qsStringifyOptions: {
      arrayFormat: 'brackets',
    },
    ...options,
  };

  request(requestOptions, (error: any, response: any, body: any) => {

    if (error) {

      debug('Error occurred:', error);

      return reject({
        status: response && response.status || 500,
        text: body || 'Internal server error'
      });

    }

    if (response.statusCode >= 400) {

      debug('makeRequest error', response.statusCode, options, response.body);

      return reject({
        status: response.statusCode,
        text: response.body
      });

    }

    if (response.statusCode === 204) {

      const xOffset = _.get(response, 'headers.x-offset');

      const res: Record<string, any> = {
        date: response.headers.date,
        status: response.statusCode
      };

      if (xOffset) {
        res.xOffset = xOffset;
      }

      return resolve(res);

    }

    if (body && _.isString(body)) {
      try {
        //debug(body);
        result = JSON.parse(body);
      } catch (err) {
        debug('JSON.parse error:', err);
        return reject();
      }
    } else {
      result = body;
    }

    return resolve({
      xOffset: response.headers['x-offset'],
      eTag: response.headers.etag,
      date: response.headers.date,
      data: result,
      status: response.statusCode,
      noCache: noCacheRe.test(response.headers['cache-control'])
    });

  });

}
