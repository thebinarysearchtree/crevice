import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { owner } from '../middleware/permission.js';
import { insert, remove } from '../controllers/followerNote.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/insert', [auth, owner], wrap(insert));
router.post('/remove', [auth, owner], wrap(remove));

export default router;
