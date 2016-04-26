'use strict';

var express = require('express');
var controller = require('./remoteCommands.controller');

var router = express.Router();
var auth = require ('../../components/auth');

router.get('/', auth ('admin'), controller.list);
router.post('/', controller.pushCommand);
router.post('/:deviceUUID', controller.pushCommand);

module.exports = router;
