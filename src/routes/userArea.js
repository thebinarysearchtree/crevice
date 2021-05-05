const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const userAreaController = require('../controllers/userArea');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(userAreaController.insert));
router.post('/update', [auth, admin], wrap(userAreaController.update));
router.post('/find', [auth, admin], wrap(userAreaController.find));
router.post('/remove', [auth, admin], wrap(userAreaController.remove));

module.exports = router;
