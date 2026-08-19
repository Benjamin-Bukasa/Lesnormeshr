const {
  changePassword,
  completeGoogleOAuth,
  getCurrentAuthState,
  login,
  register,
  requestPasswordReset,
  resetPassword,
  revokeCurrentSession,
  startGoogleOAuth,
  updateCurrentProfile,
  updateCurrentProfileAvatar,
} = require('../services/auth.service');

async function registerController(req, res) {
  const result = await register(req, res, req.body);
  res.status(201).json(result);
}

async function loginController(req, res) {
  const result = await login(req, res, req.body);
  res.status(200).json(result);
}

async function googleLoginController(req, res) {
  res.redirect(302, startGoogleOAuth(req, res));
}

async function googleCallbackController(req, res) {
  const result = await completeGoogleOAuth(req, res, req.query);
  res.redirect(302, result.redirectUrl);
}

async function logoutController(req, res) {
  await revokeCurrentSession(req, res);
  res.status(200).json({
    message: 'Deconnexion effectuee avec succes.',
  });
}

async function meController(req, res) {
  const result = await getCurrentAuthState(req.auth.user.id, req.auth.tenantId);
  res.status(200).json(result);
}

async function updateMeController(req, res) {
  const result = await updateCurrentProfile(req.auth.user.id, req.auth.tenantId, req.body);
  res.status(200).json(result);
}

async function updateMyAvatarController(req, res) {
  const result = await updateCurrentProfileAvatar(req.auth.user.id, req.auth.tenantId, req.file);
  res.status(200).json(result);
}

async function changePasswordController(req, res) {
  const result = await changePassword(req.auth.user.id, req.body);
  res.status(200).json(result);
}

async function forgotPasswordController(req, res) {
  const result = await requestPasswordReset(req.body);
  res.status(200).json(result);
}

async function resetPasswordController(req, res) {
  const result = await resetPassword(req.body);
  res.status(200).json(result);
}

module.exports = {
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
};
