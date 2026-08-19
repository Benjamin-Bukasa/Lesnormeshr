const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseNumber(value, defaultValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith('file:./')) {
    return databaseUrl;
  }

  const relativePath = databaseUrl.slice('file:'.length);
  const prismaDirectory = path.resolve(__dirname, '..', '..', 'prisma');
  const absolutePath = path.resolve(prismaDirectory, relativePath).replace(/\\/g, '/');

  return `file:${absolutePath}`;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 5000),
  databaseUrl: normalizeDatabaseUrl(process.env.DATABASE_URL || 'file:./dev.db'),
  appOrigins: (process.env.APP_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  appUrl: process.env.APP_URL || '',
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  cookieName: process.env.SESSION_COOKIE_NAME || 'lesnormes_session',
  sessionIdleTimeoutMinutes: parseNumber(process.env.SESSION_IDLE_TIMEOUT_MINUTES, 60),
  sessionTouchIntervalSeconds: parseNumber(process.env.SESSION_TOUCH_INTERVAL_SECONDS, 60),
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  cookieSameSite: process.env.COOKIE_SAME_SITE || 'lax',
  allowSelfRegistration: parseBoolean(process.env.ALLOW_SELF_REGISTRATION, true),
  exposeDebugSecrets: parseBoolean(process.env.EXPOSE_DEBUG_SECRETS, false),
  brevoApiKey: process.env.BREVO_API_KEY || '',
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'no-reply@example.com',
  brevoSenderName: process.env.BREVO_SENDER_NAME || 'LesNormes RH',
  brevoSmsSender: process.env.BREVO_SMS_SENDER || 'LESNORMES',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleOauthRedirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiAtsEnabled: parseBoolean(process.env.OPENAI_ATS_ENABLED, true),
  openAiAtsParseModel: process.env.OPENAI_ATS_PARSE_MODEL || 'gpt-5.4-mini',
  openAiAtsScreenModel: process.env.OPENAI_ATS_SCREEN_MODEL || 'gpt-5.4-mini',
  defaultTenantName: process.env.DEFAULT_TENANT_NAME || 'Tenant Principal',
  defaultTenantSlug: process.env.DEFAULT_TENANT_SLUG || 'default',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || '',
  superAdminPhone: process.env.SUPER_ADMIN_PHONE || '',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '',
};

env.sessionIdleTimeoutMs = env.sessionIdleTimeoutMinutes * 60 * 1000;
env.sessionTouchIntervalMs = env.sessionTouchIntervalSeconds * 1000;
env.isProduction = env.nodeEnv === 'production';
process.env.DATABASE_URL = env.databaseUrl;

module.exports = env;
