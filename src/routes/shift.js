const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const shiftController = require('../controllers/shift');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, admin], wrap(shiftController.insert));
router.post('/find', [auth, admin], wrap(shiftController.find));

module.exports = router;
