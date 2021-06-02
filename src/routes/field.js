const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const fieldController = require('../controllers/field');

router.post('/insert', [auth, admin], fieldController.insert);
router.post('/update', [auth, admin], fieldController.update);
router.post('/moveUp', [auth, admin], fieldController.moveUp);
router.post('/getById', [auth, admin], fieldController.getById);
router.post('/getFilenameFields', [auth, admin], fieldController.getFilenameFields);
router.post('/getCsvFields', [auth, admin], fieldController.getCsvFields);
router.post('/getAllFields', [auth, admin], fieldController.getAllFields);
router.post('/getSelectListItems', [auth, admin], fieldController.getSelectListItems);
router.post('/find', [auth, admin], fieldController.find);
router.post('/remove', [auth, admin], fieldController.remove);

module.exports = router;
