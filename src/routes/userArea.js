import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { 
  insert, 
  insertMany, 
  update, 
  find, 
  remove } from '../controllers/userArea.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, admin], wrap(insert));
router.post('/insertMany', [auth, admin], wrap(insertMany));
router.post('/update', [auth, admin], wrap(update));
router.post('/find', [auth, admin], wrap(find));
router.post('/remove', [auth, admin], wrap(remove));

export default router;
