import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';
import { insert, find, remove } from '../controllers/follower.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, owner], wrap(insert));
router.post('/find', [auth, owner], wrap(find));
router.post('/remove', [auth, owner], wrap(remove));

export default router;
