import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { files, photos } from '../middleware/upload.js';
import { uploadFiles, uploadPhotos } from '../controllers/file.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/uploadFiles', [auth, admin, files], wrap(uploadFiles));
router.post('/uploadPhotos', [auth, admin, photos], wrap(uploadPhotos));

export default router;
