'use strict';

const Status = require('./status.model');

export function index(req, res) {
  Status.scan({}, {}, function (err, statuses) {
    if (err) res.sendStatus(500);
    return res.json(statuses);
  });
}
