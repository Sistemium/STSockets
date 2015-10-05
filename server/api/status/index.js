'use strict';

var express = require('express');
var controller = require('./status.controller');

var router = express.Router();

router.post('/', controller.socketRefresh);

module.exports = router;
