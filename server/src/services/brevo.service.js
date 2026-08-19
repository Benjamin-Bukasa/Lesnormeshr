const env = require('../config/env');

async function callBrevo(endpoint, payload) {
  if (!env.brevoApiKey) {
    return {
      sent: false,
      skipped: true,
      reason: 'BREVO_API_KEY non configure.',
    };
  }

  let response;

  try {
    response = await fetch(`https://api.brevo.com/v3/${endpoint}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': env.brevoApiKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      sent: false,
      skipped: false,
      reason: `Brevo est injoignable: ${error.message}`,
    };
  }

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
  if (!toEmail) {
    return {
      sent: false,
      skipped: true,
      reason: 'Adresse email du destinataire manquante.',
    };
  }

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
  if (!phone) {
    return {
      sent: false,
      skipped: true,
      reason: 'Numero de telephone du destinataire manquant.',
    };
  }

  return callBrevo('transactionalSMS/sms', {
    sender: env.brevoSmsSender,
    recipient: phone,
    content: message,
    type: 'transactional',
  });
}

async function sendTemporaryPassword({ user, temporaryPassword, channel }) {
  const identifier = channel === 'SMS' ? user.phone : user.email;
  const loginUrl = env.appUrl || env.appOrigins[0] || 'http://localhost:5173';
  const content = `Bonjour ${user.firstName}, vos acces LesNormes RH sont disponibles. Identifiant : ${identifier}. Mot de passe temporaire : ${temporaryPassword}. Connexion : ${loginUrl}/Login. Changez ce mot de passe des votre premiere connexion.`;

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
    htmlContent: `<p>Bonjour ${user.firstName},</p><p>Votre compte LesNormes RH a ete cree.</p><p><strong>Identifiant :</strong> ${identifier}<br><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</p><p><a href="${loginUrl}/Login">Se connecter a LesNormes RH</a></p><p>Changez ce mot de passe des votre premiere connexion.</p>`,
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
