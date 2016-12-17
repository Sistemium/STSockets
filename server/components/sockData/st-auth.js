const request = require('request');

const config = require('../../config/environment');
const rolesUrl = config.pha.roles;

exports.authByToken = function (token, userAgent) {

  let options = {
    url: rolesUrl,
    headers: {
      authorization: token,
      "user-agent": userAgent
    }
  };

  return new Promise((resolve, reject) => {

    request.get(options, function (err, res, body) {

      let jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (!err && res.statusCode === 200 && jsonBody) {
        resolve(jsonBody);
      } else {
        reject(res.statusCode || err);
      }

    });

  });

};
