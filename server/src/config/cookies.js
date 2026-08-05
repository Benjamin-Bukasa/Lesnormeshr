const env = require('./env');

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.sessionIdleTimeoutMs,
    path: '/',
  };
}

module.exports = {
  getCookieOptions,
};
