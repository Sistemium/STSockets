/**
 * Created by edgarjanvuicik on 11/07/2017.
 */

module.exports = addFuncToSocket;

const _ = require('lodash');
const jsDataModel = require('../../api/jsData/jsData.model');
const emitter = require('../../components/auth/emitter');
const defaultAuthorization = require('../../api/jsData/jsData.socket').authorizedForData;

function addFuncToSocket() {

  emitter.on('dr50/auth', onAuth('dr50'));
  emitter.on('r50/auth', onAuth('r50'));

}

function onAuth(db) {

  return socket => {

    if (!socket.jsDataAuth) {

      socket.jsDataAuth = {};

    }

    if (!socket.jsDataAuthData) {

      socket.jsDataAuthData = {};

    }

    socket.jsDataAuth[`${db}/SaleOrder`] = authorizedForData;

    let options = {
      headers: {
        authorization: socket.accessToken
      }
    };
    jsDataModel.findAll(`${db}/Salesman`, _, options).then(response => {
      socket.jsDataAuthData[`${db}/SaleOrder`] = _.map(response.data, salesman => {
        return salesman.id;
      });
    })

  }

}

function authorizedForData(subscription, method, data, resource) {

  let allowedSalesmans = subscription.socket.jsDataAuthData[resource];

  if (allowedSalesmans && data.salesmanId && _.isEqual(method, 'update')) {

    return new Promise(function (resolve, reject) {
      if (_.includes(allowedSalesmans, data.salesmanId)) {
        resolve(data);
      } else {
        reject();
      }
    });

  }

  return defaultAuthorization(subscription, method, data, resource);

}
