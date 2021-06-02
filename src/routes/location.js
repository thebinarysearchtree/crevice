const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const locationController = require('../controllers/location');

router.post('/insert', [auth, admin], locationController.insert);
router.post('/update', [auth, admin], locationController.update);
router.post('/getById', [auth, admin], locationController.getById);
router.post('/getSelectListItems', [auth, admin], locationController.getSelectListItems);
router.post('/find', [auth, admin], locationController.find);
router.post('/remove', [auth, admin], locationController.remove);

module.exports = router;
