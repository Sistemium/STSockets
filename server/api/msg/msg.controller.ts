import { eachSeries } from 'async';
import _ from 'lodash';
import log from 'sistemium-debug';
import * as redis from '../../config/redis';

import config from '../../config/environment';

const { debug } = log('msg');
import * as socket from '../jsData/jsData.socket';

export interface IMsg {
  resource: string
  resourceId?: string
}

function processObject(msg: IMsg) {

  if (!msg.resourceId) {
    const hash = config.apiV4(msg.resource);
    return redis.delAsync(hash)
      .then((res: any) => {
        debug('delAsync:success', hash, res);
        return res;
      })
      .catch((res: any) => debug('delAsync:error', hash, res));
  }

  return redis.hdelAsync(config.apiV4(msg.resource), msg.resourceId)
    .then((res: any) => {
      debug('hdelAsync', config.apiV4(msg.resource), msg.resourceId, res);
      return res;
    })
    .catch((res: any) => debug('delAsync:error', msg.resourceId, res));
}

export function create(req: any, res: any, next: any) {

  const msg = req.body;

  _.assign(msg, {
    resource: `${req.params.pool}/${req.params.resource}`
  });

  _.assign(msg, req.query);

  processObject(msg)
    .then(() => {
      res.sendStatus(201);
      socket.emitEvent('update', msg.resource)({
        id: msg.resourceId,
        ts: msg.resourceTs
      });
      return null;
    })
    .catch(next);

}

export function post(req: any, res: any, next: any) {

  let data = req.body || req.query || [];

  if (!_.isArray(data)) {
    data = [data];
  }

  eachSeries(data, (msg: IMsg, done) => {

    processObject(msg)
      .then((res: any) => {
        done();
        return res;
      })
      .catch(done);

  }, (err) => {

    if (err) return next(err);

    res.sendStatus(201);

    _.each(data, msg => {
      if (msg.resourceId) {
        socket.emitEvent('update', msg.resource)({
          id: msg.resourceId,
          ts: msg.resourceTs
        });
      } else {
        socket.emitEvent('updateCollection', msg.resource)({
          ts: msg.resourceTs
        });
      }
    });

  });

}

export function destroy(req: any, res: any) {

  let hash = config.apiV4(req.params.pool + '/' + req.params.resource);

  redis.delAsync(hash)
    .then((res: any) => {
      debug('delAsync:success', hash, res);
      return res;
    })
    .catch((res: any) => debug('delAsync:error', hash, res));

  res.sendStatus(200);

}
