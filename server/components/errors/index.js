/**
 * Error responses
 */

'use strict';

module.exports[404] = function pageNotFound(req, res) {

  let viewFilePath = '404';
  let statusCode = 404;
  let result = {
    status: statusCode
  };

  res.status(result.status);
  res.render(viewFilePath, function (err) {
    if (err) { return res.json(result, result.status); }

    res.render(viewFilePath);
  });
};
