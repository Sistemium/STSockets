'use strict';

const express = require('express');
const controller = require('./remoteCommands.controller');

const router = express.Router();
const auth = require ('../../components/auth');

router.get('/', auth ('admin'), controller.list);
router.post('/', controller.pushCommand);
router.post('/:deviceUUID', controller.pushCommand);

module.exports = router;
