const express = require('express');
const multer = require('multer');
const router = express.Router();
const serveStatic = require('serve-static');

import {processUpload} from './process-request';

const logErrors = function (err, req, res, next) {
  let timestamp = Date.now();
  console.log(timestamp + ' error: %s', err);
  timestamp = Date.now();
  console.log(timestamp + ' error: %s', err.stack);
  next(err);
};

const processor = [multer().any(), processUpload, logErrors];

router.post('/', processor);
router.use(serveStatic('uploads'));

module.exports = router;
