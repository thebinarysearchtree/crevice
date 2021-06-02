const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const shiftController = require('../controllers/shift');

router.post('/insert', [auth, admin], shiftController.insert);
router.post('/find', [auth, admin], shiftController.find);

module.exports = router;
