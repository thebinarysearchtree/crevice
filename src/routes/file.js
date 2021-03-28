const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const { files, photos } = require('../middleware/upload');
const fileController = require('../controllers/file');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/uploadFiles', [auth, admin, files], wrap(fileController.uploadFiles));
router.post('/uploadPhotos', [auth, admin, photos], wrap(fileController.uploadPhotos));

module.exports = router;
