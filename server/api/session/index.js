'use strict';

const express = require('express');
const controller = require('./session.controller');

const auth = require ('../../components/auth');

const router = express.Router();

router.get('/', auth ('admin'), controller.list);
//router.get('/:id', controller.getById);

module.exports = router;
