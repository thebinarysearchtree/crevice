import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { remove } from '../controllers/shiftSeries.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/remove', [auth, admin], wrap(remove));

export default router;
