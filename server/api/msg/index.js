'use strict';

var express = require('express');
var router = express.Router();
var controller = require('./msg.controller');
var debug = require('debug')('sts:msg');

debug ('index');
// router.get('/:pool/:resource', controller.index);
// router.get('/:pool/:resource/:id', controller.show);
router.post('/', controller.post);
router.post('/:pool/:resource', controller.create);
router.delete('/:pool/:resource', controller.delete);

module.exports = router;
