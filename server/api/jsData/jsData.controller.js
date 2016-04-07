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

  jsDataModel.findAll(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.show = function (req, res, next) {

  jsDataModel.find(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.create = function (req, res, next) {

  jsDataModel.create(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.update = function (req, res, next) {

  jsDataModel.update(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.destroy = function (req, res, next) {

  jsDataModel.destroy(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};
