const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const { photos } = require('../middleware/upload');
const userController = require('../controllers/user');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/signUp', wrap(userController.signUp));
router.post('/verify', wrap(userController.verify));
router.post('/lostPassword', wrap(userController.lostPassword));
router.post('/changePasswordWithToken', wrap(userController.changePasswordWithToken));
router.post('/getToken', wrap(userController.getToken));
router.post('/refreshToken', wrap(userController.refreshToken));

router.post('/inviteUsers', [auth, admin], wrap(userController.inviteUsers));
router.post('/resendInvitation', [auth, admin], wrap(userController.resendInvitation));
router.post('/checkeEmailExists', auth, wrap(userController.checkEmailExists));
router.post('/changePassword', auth, wrap(userController.changePassword));
router.post('/update', auth, wrap(userController.update));
router.post('/remove', [auth, admin], wrap(userController.remove));

router.post('/changeImage', [auth, admin, photos], wrap(userController.changeImage));
router.post('/uploadImages', [auth, admin, photos], wrap(userController.uploadImages));

module.exports = router;
