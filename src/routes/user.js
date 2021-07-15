import { Router } from 'express';
import auth from '../middleware/authentication.js';
import { admin } from '../middleware/permission.js';
import { photos } from '../middleware/upload.js';
import { 
  signUp, 
  verify, 
  lostPassword, 
  changePasswordWithToken, 
  getToken, 
  refreshToken, 
  inviteUsers, 
  resendInvitation, 
  checkEmailExists, 
  changePassword, 
  find, 
  getUserDetails, 
  remove, 
  changeImage, 
  updateImages } from '../controllers/user.js';

const wrap = fn => (...args) => fn(...args).catch(args[2]);

const router = Router();

router.post('/signUp', wrap(signUp));
router.post('/verify', wrap(verify));
router.post('/lostPassword', wrap(lostPassword));
router.post('/changePasswordWithToken', wrap(changePasswordWithToken));
router.post('/getToken', wrap(getToken));
router.post('/refreshToken', wrap(refreshToken));

router.post('/inviteUsers', [auth, admin], wrap(inviteUsers));
router.post('/resendInvitation', [auth, admin], wrap(resendInvitation));
router.post('/checkeEmailExists', auth, wrap(checkEmailExists));
router.post('/changePassword', auth, wrap(changePassword));
router.post('/find', auth, wrap(find));
router.post('/getUserDetails', [auth, admin], wrap(getUserDetails));
router.post('/remove', [auth, admin], wrap(remove));

router.post('/changeImage', [auth, admin], wrap(changeImage));
router.post('/updateImages', [auth, admin], wrap(updateImages));

export default router;
