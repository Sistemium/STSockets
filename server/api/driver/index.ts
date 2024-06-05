import express from 'express';
import * as controller from './driver.controller';

const router = express.Router();

router.post('/', controller.driversRefresh);
router.post('/driver', controller.driverRefresh);

export default router;
