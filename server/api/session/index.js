'use strict';

var express = require('express');
var controller = require('./session.controller');

var router = express.Router();

router.get('/', controller.list);
//router.get('/:id', controller.getById);

module.exports = router;
