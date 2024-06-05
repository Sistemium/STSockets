import express from 'express';
import * as controller from './msg.controller';
import log from 'sistemium-debug';

const { debug } = log('msg');
const router = express.Router();

router.post('/', controller.post);
router.post('/:pool/:resource', controller.create);
router.delete('/:pool/:resource', controller.delete);

export default router;
