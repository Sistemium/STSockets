import express from 'express';
import * as controller from './jsData.controller';

const router = express.Router();

router.get('/:pool/:resource', controller.index);
router.get('/:pool/:resource/:id', controller.show);
router.get('/:pool/:parentResource/:parentId/:resource', controller.indexBy);
router.post('/:pool/:resource', controller.create);
router.put('/:pool/:resource/:id', controller.update);
router.delete('/:pool/:resource/:id', controller.destroy);

export default router;
