const crypto = require('crypto');

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashOpaqueToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function generateOtpCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

module.exports = {
  generateOpaqueToken,
  hashOpaqueToken,
  generateOtpCode,
};
