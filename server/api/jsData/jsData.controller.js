'use strict';
let jsDataModel = require('./jsData.model');


function handleResponse (response) {
  return data => response.json(data);
}

function handleError (response, next) {
  return err => {
    if (err === 401) {
      return response.status(401).end();
    }

    next(err);
  }
}

exports.index = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let params = req.query;
  let options = req.headers;

  jsDataModel.findAll(resource, params, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.show = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let options = req.headers;

  jsDataModel.find(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.create = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let attrs = req.body || req.query;
  let options = req.headers;

  jsDataModel.create(resource, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.update = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let attrs = req.body || req.query;
  let options = req.headers;

  jsDataModel.update(resource, id, attrs, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.destroy = function (req, res, next) {

  let resource = req.params.pool + '/' + req.params.resource;
  let id = req.params.id;
  let options = req.headers;

  jsDataModel.destroy(resource, id, options)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};
