const express = require('express');
const multer = require('multer');
const router = express.Router();
const serveStatic = require('serve-static');

import {processUpload, processError} from './process-request';

const processor = [multer().any(), processUpload, processError];

router.post('/', processor);
router.use(serveStatic('uploads'));

module.exports = router;
