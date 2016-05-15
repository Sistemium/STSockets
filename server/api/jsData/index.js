'use strict';

var express = require('express');
var controller = require('./jsData.controller');

var router = express.Router();

router.get('/:pool/:resource', controller.index);
router.get('/:pool/:resource/:id', controller.show);
router.get('/:pool/:parentResource/:parentId/:resource', controller.indexBy);
router.post('/:pool/:resource', controller.create);
router.put('/:pool/:resource/:id', controller.update);
router.delete('/:pool/:resource/:id', controller.destroy);

module.exports = router;
