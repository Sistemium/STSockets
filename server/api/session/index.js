'use strict';

const express = require('express');
const controller = require('./session.controller');

const auth = require('../../components/auth');

const router = express.Router();
const allowOnlyForAdmin = auth('admin');

router.get('/', allowOnlyForAdmin, controller.list);
//router.get('/:id', controller.getById);

module.exports = router;
