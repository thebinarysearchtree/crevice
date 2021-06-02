const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const roleController = require('../controllers/role');

router.post('/insert', [auth, admin], roleController.insert);
router.post('/update', [auth, admin], roleController.update);
router.post('/getById', [auth, admin], roleController.getById);
router.post('/getSelectListItems', [auth, admin], roleController.getSelectListItems);
router.post('/find', [auth, admin], roleController.find);
router.post('/remove', [auth, admin], roleController.remove);

module.exports = router;
