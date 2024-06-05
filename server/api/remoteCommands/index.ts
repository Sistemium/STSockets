import express from 'express';
import * as controller from './remoteCommands.controller';
import config from '../../config/environment';

const router = express.Router();
const auth = require('../../components/auth').authenticator;
const allowOnlyForAdmin = auth(config.api.adminRoles);


router.get('/', allowOnlyForAdmin, controller.list);
router.post('/', controller.deviceUUIDRequiredError);
router.post('/:deviceUUID', controller.pushCommand);


export default router;
