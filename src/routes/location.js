const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const locationController = require('../controllers/location');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(locationController.insert));
router.post('/update', [auth, admin], wrap(locationController.update));
router.post('/getById', [auth, admin], wrap(locationController.getById));
router.post('/getSelectListItems', [auth, admin], wrap(locationController.getSelectListItems));
router.post('/find', [auth, admin], wrap(locationController.find));
router.post('/remove', [auth, admin], wrap(locationController.remove));

module.exports = router;
