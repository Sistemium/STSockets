'use strict';

var express = require('express');
var controller = require('./jsData.controller');

var router = express.Router();

router.get('/:pool/:resource', controller.index);
router.get('/:pool/:resource/:id', controller.show);

module.exports = router;
