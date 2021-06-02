const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const { files, photos } = require('../middleware/upload');
const fileController = require('../controllers/file');

router.post('/uploadFiles', [auth, admin, files], fileController.uploadFiles);
router.post('/uploadPhotos', [auth, admin, photos], fileController.uploadPhotos);

module.exports = router;
