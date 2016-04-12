var config = require('../../config/environment');
var apiV3 = config.APIv3;

var request = require('request');
var _ = require('lodash');

var db = {};

exports.get = function (request,socket) {

  var e = db [request.entity];

  return new Promise (function (resolve,reject) {
    //if (!e) {
      getEntityData(request,socket).then (resolve,reject);
    //} else {
    //  console.log ('have data:', _.first(e.data));
    //  resolve (e.data);
    //}
  });

};

var getEntityData = function (req, socket) {

  var
    token = socket.accessToken,
    userAgent = socket.userAgent,
    deviceUUID = socket.deviceUUID,
    org = socket.org,
    entity = req.entity
  ;

  var options = {
    url: apiV3 + org + '/' + entity,
    headers: {
      authorization: token,
      deviceUUID: deviceUUID,
      "user-agent": userAgent,
      'if-none-match': '*',
      'page-size': '500',
      'x-real-ip': socket.handshake.headers['x-real-ip'] || socket.handshake.address
    },
    qs: req.params
  };

  console.info ('SAPIV3 getEntityData entity:', entity);

  var executor = function (resolve,reject){

    var storedEntity = db [entity];

    if (!storedEntity) {
      storedEntity = db [entity] = {
        etag: '*',
        data: []
      };
    }

    var onResponse = function(err,res,body){

      var jsonBody;

      if (err) {
        console.log(err);
      }

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (jsonBody && jsonBody.length && res.statusCode == 200) {
        console.info ('st-api-v3.getEntityData got count:', jsonBody.length, 'ETag:', res.headers.etag);
        storedEntity.data = _.unique (_.union (jsonBody, storedEntity.data),'id');

        if (res.headers.etag) {
          options.headers ['if-none-match'] = (storedEntity.etag = res.headers.etag);
          return request.get(options, onResponse);
        }
        resolve (storedEntity.data);
      } else if (res.statusCode == 204) {
        console.info ('st-api-v3.getEntityData final count:', storedEntity.data.length);
        console.info ('st-api-v3.getEntityData final sample:', _.first(storedEntity.data));
        resolve (storedEntity.data);
      } else {
        console.error ('st-api-v3.getEntityData error:', res.statusCode);
        reject ();
      }

    };

    request.get(options,onResponse);

  };

  return new Promise (executor);

};
