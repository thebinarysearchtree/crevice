import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { 
  insert, 
  update, 
  getById, 
  getWithLocation, 
  getSelectListItems, 
  find, 
  remove } from '../controllers/area.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, admin], wrap(insert));
router.post('/update', [auth, admin], wrap(update));
router.post('/getById', [auth, admin], wrap(getById));
router.post('/getWithLocation', [auth, admin], wrap(getWithLocation));
router.post('/getSelectListItems', [auth, admin], wrap(getSelectListItems));
router.post('/find', [auth, admin], wrap(find));
router.post('/remove', [auth, admin], wrap(remove));

export default router;
