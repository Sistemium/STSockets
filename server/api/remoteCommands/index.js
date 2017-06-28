'use strict';

const express = require('express');
const controller = require('./remoteCommands.controller');

const router = express.Router();
const config = require('../../config/environment');
const auth = require('../../components/auth');
const allowOnlyForAdmin = auth(config.api.adminRoles);


router.get('/', allowOnlyForAdmin, controller.list);
router.post('/', controller.deviceUUIDRequiredError);
router.post('/:deviceUUID', controller.pushCommand);


module.exports = router;
