const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const { admin } = require('../middleware/permission');
const { photos } = require('../middleware/upload');
const userController = require('../controllers/user');

router.post('/signUp', userController.signUp);
router.post('/verify', userController.verify);
router.post('/lostPassword', userController.lostPassword);
router.post('/changePasswordWithToken', userController.changePasswordWithToken);
router.post('/getToken', userController.getToken);
router.post('/refreshToken', userController.refreshToken);

router.post('/inviteUsers', [auth, admin], userController.inviteUsers);
router.post('/resendInvitation', [auth, admin], userController.resendInvitation);
router.post('/checkeEmailExists', auth, userController.checkEmailExists);
router.post('/changePassword', auth, userController.changePassword);
router.post('/find', auth, userController.find);
router.post('/getUserDetails', [auth, admin], userController.getUserDetails);
router.post('/update', auth, userController.update);
router.post('/remove', [auth, admin], userController.remove);

router.post('/changeImage', [auth, admin], userController.changeImage);
router.post('/updateImages', [auth, admin], userController.updateImages);

module.exports = router;
