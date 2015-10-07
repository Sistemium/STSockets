'use strict';

var express = require('express');
var controller = require('./driver.controller');

var router = express.Router();

router.post('/', controller.driversRefresh);
router.post('/driver', controller.driverRefresh);

module.exports = router;
