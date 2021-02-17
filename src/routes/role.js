const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const roleController = require('../controllers/role');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(roleController.insert));
router.post('/update', [auth, admin], wrap(roleController.update));
router.post('/getById', [auth, admin], wrap(roleController.getById));
router.post('/getSelectListItems', [auth, admin], wrap(roleController.getSelectListItems));
router.post('/find', [auth, admin], wrap(roleController.find));
router.post('/remove', [auth, admin], wrap(roleController.remove));

module.exports = router;
