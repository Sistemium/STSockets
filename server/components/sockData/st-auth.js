var config = require('../../config/environment');

var rolesUrl = config.pha.roles;
var Q = require ('q');
var request = require('request');

exports.authByToken = function (token,userAgent) {

  var options = {
    url: rolesUrl,
    headers: {
      authorization: token,
      "user-agent": userAgent
    }
  };

  var q = Q.defer ();

  var promise = function (resolve,reject) {

    request.get(options,function(err,res,body){

      var jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (!err && res.statusCode === 200 && jsonBody) {
        resolve (jsonBody);
      } else {
        reject (res.statusCode || err);
      }

    });

  };

  promise (q.resolve,q.reject);

  return q.promise;

};
