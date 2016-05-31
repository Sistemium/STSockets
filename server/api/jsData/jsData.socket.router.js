'use strict';

let jsDataModel = require('./jsData.model');
let debug = require('debug')('sts:jsData:socket:router');

function handleSuccess(callback, method, resource, params) {
  return reply => {
    var res = {data: reply || []};
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
      offset: offset
    };
    if (offset) {
      res.offset = offset;
    }
    console.info ('JSD', method, resource, params, res.data.id ? 1 : res.data.length);
    callback(res);
    return reply;
  }
}

function handleError(callback) {
  return err => {
    debug('error occurred', err);
    callback({error: err})
  };
}


function router (data, callback) {

  var success = handleSuccess(callback, data.method, data.resource, data.id || data.params);
  var failure = handleError(callback);

  switch (data.method) {

    case 'findAll' :
    {
      jsDataModel.findAll(data.resource, data.params, data.options)
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
