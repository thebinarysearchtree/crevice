import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin, owner } from '../middleware/permission.js';
import { 
  insert, 
  find, 
  getAvailableShifts,
  remove,
  removeSeries } from '../controllers/shift.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, admin], wrap(insert));
router.post('/find', [auth, admin], wrap(find));
router.post('/getAvailableShifts', [auth, owner], wrap(getAvailableShifts));
router.post('/remove', [auth, admin], wrap(remove));
router.post('/removeSeries', [auth, admin], wrap(removeSeries));

export default router;
