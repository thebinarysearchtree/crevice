import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { 
  insert, 
  update, 
  moveUp, 
  getById, 
  getFilenameFields, 
  getCsvFields, 
  getAllFields, 
  getSelectListItems, 
  find, 
  remove } from '../controllers/field.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, admin], wrap(insert));
router.post('/update', [auth, admin], wrap(update));
router.post('/moveUp', [auth, admin], wrap(moveUp));
router.post('/getById', [auth, admin], wrap(getById));
router.post('/getFilenameFields', [auth, admin], wrap(getFilenameFields));
router.post('/getCsvFields', [auth, admin], wrap(getCsvFields));
router.post('/getAllFields', [auth, admin], wrap(getAllFields));
router.post('/getSelectListItems', [auth, admin], wrap(getSelectListItems));
router.post('/find', [auth, admin], wrap(find));
router.post('/remove', [auth, admin], wrap(remove));

export default router;
