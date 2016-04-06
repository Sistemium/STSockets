'use strict';
let findAll = require('./jsData.model').findAll;
let find = require('./jsData.model').find;


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

  findAll(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};

exports.show = function (req, res, next) {

  find(req)
    .then(handleResponse(res))
    .catch(handleError(res, next))
  ;

};
