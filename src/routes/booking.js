const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { owner } = require('../middleware/permission');
const bookingController = require('../controllers/booking');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/insert', [auth, owner], wrap(bookingController.insert));

module.exports = router;
