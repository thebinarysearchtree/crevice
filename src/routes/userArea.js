const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const userAreaController = require('../controllers/userArea');

router.post('/insert', [auth, admin], userAreaController.insert);
router.post('/insertMany', [auth, admin], userAreaController.insertMany);
router.post('/update', [auth, admin], userAreaController.update);
router.post('/find', [auth, admin], userAreaController.find);
router.post('/remove', [auth, admin], userAreaController.remove);

module.exports = router;
