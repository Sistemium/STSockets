'use strict';

const express = require('express');
const controller = require('./session.controller');
const router = express.Router();

const auth = require('../../components/auth');

const config = require('../../config/environment');
const allowOnlyForAdmin = auth(config.api.adminRoles);

router.get('/', allowOnlyForAdmin, controller.list);
//router.get('/:id', controller.getById);

module.exports = router;
