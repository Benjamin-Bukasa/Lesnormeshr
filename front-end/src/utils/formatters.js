export function formatName(user) {
  if (!user || typeof user !== 'object') {
    return 'N/A';
  }

  const firstName = String(user.firstName || user.firstname || '').trim();
  const lastName = String(user.lastName || user.lastname || '').trim();
  const fullName = String(user.fullName || user.name || '').trim();

  if (fullName) {
    return fullName;
  }

  const joined = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (joined) {
    return joined;
  }

  const email = String(user.email || '').trim();
  if (email) {
    return email;
  }

  return 'N/A';
}

export default formatName;
