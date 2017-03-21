'use strict';

const express = require('express');
const controller = require('./driver.controller');

const router = express.Router();

router.post('/', controller.driversRefresh);
router.post('/driver', controller.driverRefresh);

module.exports = router;
