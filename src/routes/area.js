const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const areaController = require('../controllers/area');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(areaController.insert));
router.post('/update', [auth, admin], wrap(areaController.update));
router.post('/getById', [auth, admin], wrap(areaController.getById));
router.post('/getSelectListItems', [auth, admin], wrap(areaController.getSelectListItems));
router.post('/find', [auth, admin], wrap(areaController.find));
router.post('/remove', [auth, admin], wrap(areaController.remove));

module.exports = router;
