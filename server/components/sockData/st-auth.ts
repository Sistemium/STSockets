// @ts-ignore
import request from 'request';
import config from '../../config/environment';

const rolesUrl = config.pha.roles;

export function authByToken(token: string, userAgent: string) {

  const options = {
    url: rolesUrl,
    headers: {
      authorization: token,
      'user-agent': userAgent
    }
  };

  return new Promise((resolve, reject) => {

    request.get(options, (err: any, res: any, body: any) => {

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

}
