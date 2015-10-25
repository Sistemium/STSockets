'use strict';

var express = require('express');
var controller = require('./session.controller');

var router = express.Router();

var auth = require ('../../components/auth');

router.get('/', auth ('admin'), controller.list);
//router.get('/:id', controller.getById);

module.exports = router;
