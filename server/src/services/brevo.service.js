const env = require('../config/env');

async function callBrevo(endpoint, payload) {
  if (!env.brevoApiKey) {
    return {
      sent: false,
      skipped: true,
      reason: 'BREVO_API_KEY non configure.',
    };
  }

  const response = await fetch(`https://api.brevo.com/v3/${endpoint}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': env.brevoApiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      sent: false,
      skipped: false,
      reason: body?.message || 'Echec de livraison Brevo.',
      providerResponse: body,
    };
  }

  return {
    sent: true,
    skipped: false,
    providerResponse: body,
  };
}

async function sendEmail({ toEmail, toName, subject, textContent, htmlContent }) {
  return callBrevo('smtp/email', {
    sender: {
      email: env.brevoSenderEmail,
      name: env.brevoSenderName,
    },
    to: [{ email: toEmail, name: toName }],
    subject,
    textContent,
    htmlContent,
  });
}

async function sendSms({ phone, message }) {
  return callBrevo('transactionalSMS/sms', {
    sender: env.brevoSmsSender,
    recipient: phone,
    content: message,
    type: 'transactional',
  });
}

async function sendTemporaryPassword({ user, temporaryPassword, channel }) {
  const content = `Bonjour ${user.firstName}, votre mot de passe temporaire est : ${temporaryPassword}. Connectez-vous puis changez-le immediatement.`;

  if (channel === 'SMS') {
    return sendSms({
      phone: user.phone,
      message: content,
    });
  }

  return sendEmail({
    toEmail: user.email,
    toName: `${user.firstName} ${user.lastName}`.trim(),
    subject: 'Vos acces LesNormes RH',
    textContent: content,
    htmlContent: `<p>Bonjour ${user.firstName},</p><p>Votre mot de passe temporaire est : <strong>${temporaryPassword}</strong></p><p>Connectez-vous puis changez-le immediatement.</p>`,
  });
}

async function sendPasswordResetCode({ user, code, channel }) {
  const content = `Bonjour ${user.firstName}, votre code de reinitialisation LesNormes RH est ${code}. Ce code expire dans 15 minutes.`;

  if (channel === 'SMS') {
    return sendSms({
      phone: user.phone,
      message: content,
    });
  }

  return sendEmail({
    toEmail: user.email,
    toName: `${user.firstName} ${user.lastName}`.trim(),
    subject: 'Code de reinitialisation du mot de passe',
    textContent: content,
    htmlContent: `<p>Bonjour ${user.firstName},</p><p>Votre code de reinitialisation est : <strong>${code}</strong></p><p>Il expire dans 15 minutes.</p>`,
  });
}

module.exports = {
  sendTemporaryPassword,
  sendPasswordResetCode,
};
