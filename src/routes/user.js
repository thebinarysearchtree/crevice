const express = require('express');
const router = express.Router();
const auth = require('../middleware/authentication');
const userController = require('../controllers/user');

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/signup', wrap(userController.signUp));
router.post('/verify', wrap(userController.verify));
router.post('/inviteusers', auth, wrap(userController.inviteUsers));
router.post('/resendinvitation', auth, wrap(userController.resendInvitation));
router.post('/lostpassword', wrap(userController.lostPassword));
router.post('/changepasswordwithtoken', wrap(userController.changePasswordWithToken));
router.post('/checkemailexists', auth, wrap(userController.checkEmailExists));
router.post('/gettoken', wrap(userController.getToken));
router.post('/refreshtoken', wrap(userController.refreshToken));
router.post('/changepassword', auth, wrap(userController.changePassword));
router.post('/update', auth, wrap(userController.update));
router.post('/changeImage', auth, wrap(userController.update));
router.post('/deleteuser', auth, wrap(userController.deleteUser));

module.exports = router;
