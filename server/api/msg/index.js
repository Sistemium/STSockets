'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./msg.controller');
const debug = require('debug')('sts:msg');

router.post('/', controller.post);
router.post('/:pool/:resource', controller.create);
router.delete('/:pool/:resource', controller.delete);

module.exports = router;
