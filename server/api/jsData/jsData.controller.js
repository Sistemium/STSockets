'use strict';

const jsDataModel = require('./jsData.model');


exports.indexBy = function (req, res, next) {

  let resource = `${req.params.pool}/${req.params.parentResource}/${req.params.parentId}/${req.params.resource}`;
  let params = req.query;
  let options = {
    headers: req.headers
  };

  jsDataModel.findAll(resource, params, options)
    .then(handleFindAllResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.index = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let params = req.query;
  let options = {
    headers: req.headers
  };

  jsDataModel.findAll(resource, params, options)
    .then(handleFindAllResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.show = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let options = {
    headers: req.headers
  };

  jsDataModel.find(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.create = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let attrs = req.body;
  let options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.create(resource, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.update = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let attrs = req.body;
  let options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.update(resource, id, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.destroy = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let options = {
    headers: req.headers,
    qs: req.query
  };

  jsDataModel.destroy(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

function handleResponse(response) {
  return (data) => {
    response.json(data);
  };
}

function handleFindAllResponse(response) {
  return (res) => {
    let offset = res && res.xOffset;
    if (offset) {
      response.set('X-Offset', offset);
    }
    response.json(res.data);
  };
}

function handleError(response, next) {
  return errObj => {

    let err = errObj && errObj.status || errObj;

    if (err === 401) {
      return response.status(401).end();
    }

    if (err === 404) {
      return response.status(404).end();
    }

    if (err && err.response && err.response.status === 500) {
      return response.status(500).end(err.error);
    }

    next(err);
  }
}
