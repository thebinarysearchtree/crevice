const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const areaController = require('../controllers/area');

router.post('/insert', [auth, admin], areaController.insert);
router.post('/update', [auth, admin], areaController.update);
router.post('/getById', [auth, admin], areaController.getById);
router.post('/getWithLocation', [auth, admin], areaController.getWithLocation);
router.post('/getSelectListItems', [auth, admin], areaController.getSelectListItems);
router.post('/find', [auth, admin], areaController.find);
router.post('/remove', [auth, admin], areaController.remove);

module.exports = router;
