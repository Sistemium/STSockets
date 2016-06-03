'use strict';

let jsDataModel = require('./jsData.model');
let debug = require('debug')('sts:jsData:socket:router');
let _ = require('lodash');

function handleSuccess(callback, method, resource, params) {
  return reply => {
    var res = {
      data: reply || [],
      resource: resource
    };
    console.info ('JSD', method, resource, params, res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleFindAllSuccess(callback, method, resource, params) {
  return reply => {
    let offset = reply && reply.xOffset;
    var res = {
      data: reply.data || [],
      offset: offset,
      resource: resource
    };
    if (offset) {
      res.offset = offset;
    }
    console.info ('JSD', method, resource, params, res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleError(callback, resource) {
  return errObj => {
    let err = errObj && errObj.status || errObj;
    debug('error occurred', err);
    callback({
      error: err,
      text: errObj.text,
      resource: resource
    })
  };
}


function router (data, callback) {

  var success = handleSuccess(callback, data.method, data.resource, data.id || data.params);
  var failure = handleError(callback, data.resource);
  var offset = _.get(data,'options.offset');

  var params = data.params || {};

  if (offset) {
    params['x-offset:'] = offset;
  }

  var pageSize = _.get(data,'options.pageSize');

  if (pageSize) {
    params['x-page-size:'] = pageSize;
  }

  switch (data.method) {

    case 'findAll' :
    {
      jsDataModel.findAll(data.resource, params, data.options)
        .then(handleFindAllSuccess(callback, data.method, data.resource, data.id || data.params))
        .catch(failure)
      ;
      break;
    }
    case 'find':
    {
      jsDataModel.find(data.resource, data.id, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'create':
    {
      jsDataModel.create(data.resource, data.attrs, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'update':
    {
      jsDataModel.update(data.resource, data.id, data.attrs, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    case 'destroy':
    {
      jsDataModel.destroy(data.resource, data.id, data.options)
        .then(success)
        .catch(failure)
      ;
      break;
    }
    default:
    {
      return failure (`Unsupported method '${data.method}'`);
    }
  }

}

module.exports = router;
