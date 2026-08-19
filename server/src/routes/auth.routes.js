const express = require('express');

const asyncHandler = require('../utils/async-handler');
const { requireAuth } = require('../middleware/auth.middleware');
const { profileAvatarUpload } = require('../middleware/upload.middleware');
const {
  changePasswordController,
  forgotPasswordController,
  googleCallbackController,
  googleLoginController,
  loginController,
  logoutController,
  meController,
  registerController,
  resetPasswordController,
  updateMyAvatarController,
  updateMeController,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', asyncHandler(registerController));
router.post('/login', asyncHandler(loginController));
router.get('/google', asyncHandler(googleLoginController));
router.get('/google/callback', asyncHandler(googleCallbackController));
router.post('/logout', requireAuth, asyncHandler(logoutController));
router.get('/me', requireAuth, asyncHandler(meController));
router.patch('/me', requireAuth, asyncHandler(updateMeController));
router.patch('/me/avatar', requireAuth, profileAvatarUpload.single('file'), asyncHandler(updateMyAvatarController));
router.post('/change-password', requireAuth, asyncHandler(changePasswordController));
router.post('/forgot-password', asyncHandler(forgotPasswordController));
router.post('/reset-password', asyncHandler(resetPasswordController));

module.exports = router;
