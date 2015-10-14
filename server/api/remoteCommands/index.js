'use strict';

var express = require('express');
var controller = require('./remoteCommands.controller');

var router = express.Router();

router.post('/', controller.pushCommand);
router.post('/:deviceUUID', controller.pushCommand);

module.exports = router;
