import _ from 'lodash';
import log from 'sistemium-debug';
import * as jsDataModel from './jsData.model';

const { debug } = log('jsData:socket:router');

export default function(data: any, callback: any, socketId: string) {

  const success = handleSuccess(callback, data.method, data.resource, data.id || data.params, data.context, socketId);
  const failure = handleError(callback, data.method, data.resource, data.id, data.context, socketId);
  const offset = _.get(data, 'options.offset');

  const params = data.params || {};

  if (offset) {
    params['x-offset:'] = offset;
  }

  const pageSize = _.get(data, 'options.pageSize');

  if (pageSize) {
    params['x-page-size:'] = pageSize;
  }

  switch (data.method) {

    case 'findAll' : {
      jsDataModel.findAll(data.resource, params, data.options)
        .then(handleFindAllSuccess(callback, data.method, data.resource, data.id || data.params, data.context, pageSize, socketId))
        .catch(failure)
      ;
      break;
    }
    case 'find': {
      jsDataModel.find(data.resource, data.id, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'create': {
      jsDataModel.create(data.resource, data.attrs, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'update': {
      jsDataModel.update(data.resource, data.id, data.attrs, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'destroy': {
      jsDataModel.destroy(data.resource, data.id, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    default: {
      return failure(`Unsupported method '${data.method}'`);
    }
  }

}


function handleSuccess(callback: any, method: string, resource: string, params: any, context: any, socketId: string) {
  return (reply: any) => {
    const res: Record<string, any> = {
      data: reply || [],
      resource: resource,
      method: method
    };
    if (context) {
      res.context = context;
    }
    debug('handleSuccess', socketId, method, resource, params, res.data.id ? 1 : res.data.length, context);
    callback(res);
    return reply;
  }
}

function handleFindAllSuccess(callback: any, method: string, resource: string, params: any, context: any, pageSize: number, socketId: string) {
  return (reply: any) => {
    const res: Record<string, any> = {
      data: reply.data || [],
      resource: resource,
      method: method, context
    };
    const offset = reply && reply.xOffset;
    if (offset) {
      res.offset = offset;
    }
    if (pageSize) {
      res.pageSize = pageSize;
    }
    if (context) {
      res.context = context;
    }
    debug('handleFindAllSuccess', socketId, method, resource, JSON.stringify(params), res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleError(callback: any, method: string, resource: string, id: string, context: any, socketId: string) {
  return (errObj: any) => {
    const err = errObj && errObj.status || errObj;
    const res: Record<string, any> = {
      error: err,
      text: errObj.text,
      resource: resource,
      method: method
    };
    if (id) {
      res.id = id;
    }
    if (context) {
      res.context = context;
    }
    debug('handleError', socketId, JSON.stringify(res));
    callback(res)
  };
}

