'use strict';

const jsDataModel = require('./jsData.model');
const debug = require('debug')('sts:jsData:socket:router');
const _ = require('lodash');


module.exports = router;


function router(data, callback) {

  let success = handleSuccess(callback, data.method, data.resource, data.id || data.params);
  let failure = handleError(callback, data.method, data.resource, data.id);
  let offset = _.get(data, 'options.offset');

  let params = data.params || {};

  if (offset) {
    params['x-offset:'] = offset;
  }

  let pageSize = _.get(data, 'options.pageSize');

  if (pageSize) {
    params['x-page-size:'] = pageSize;
  }

  switch (data.method) {

    case 'findAll' : {
      jsDataModel.findAll(data.resource, params, data.options)
        .then(handleFindAllSuccess(callback, data.method, data.resource, data.id || data.params))
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


function handleSuccess(callback, method, resource, params) {
  return reply => {
    let res = {
      data: reply || [],
      resource: resource,
      method: method
    };
    console.info('JSD', method, resource, params, res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleFindAllSuccess(callback, method, resource, params) {
  return reply => {
    let offset = reply && reply.xOffset;
    let res = {
      data: reply.data || [],
      offset: offset,
      resource: resource,
      method: method
    };
    if (offset) {
      res.offset = offset;
    }
    console.info('JSD', method, resource, params, res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleError(callback, method, resource, id) {
  return errObj => {
    let err = errObj && errObj.status || errObj;
    debug('error occurred', err);
    let res = {
      error: err,
      text: errObj.text,
      resource: resource,
      method: method
    };
    if (id) {
      res.id = id;
    }
    callback(res)
  };
}

