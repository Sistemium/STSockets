import express from 'express';
import * as controller from './session.controller';
import config from '../../config/environment';
import { authenticator as auth } from '../../components/auth';

const router = express.Router();

const allowOnlyForAdmin = auth(config.api.adminRoles);

router.get('/', allowOnlyForAdmin, controller.list);
//router.get('/:id', controller.getById);

export default router;
