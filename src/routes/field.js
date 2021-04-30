const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const fieldController = require('../controllers/field');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(fieldController.insert));
router.post('/update', [auth, admin], wrap(fieldController.update));
router.post('/moveUp', [auth, admin], wrap(fieldController.moveUp));
router.post('/getById', [auth, admin], wrap(fieldController.getById));
router.post('/getFilenameFields', [auth, admin], wrap(fieldController.getFilenameFields));
router.post('/getCsvFields', [auth, admin], wrap(fieldController.getCsvFields));
router.post('/getAllFields', [auth, admin], wrap(fieldController.getAllFields));
router.post('/getSelectListItems', [auth, admin], wrap(fieldController.getSelectListItems));
router.post('/find', [auth, admin], wrap(fieldController.find));
router.post('/remove', [auth, admin], wrap(fieldController.remove));

module.exports = router;
