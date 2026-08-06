export function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatUnits(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} jour${Number(value || 0) > 1 ? 's' : ''}`;
}

const LEAVE_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  IN_MANAGER_REVIEW: 'Validation manager',
  IN_HR_REVIEW: 'Validation RH',
  APPROVED: 'Approuvée',
  REJECTED: 'Rejetée',
  CANCELLED: 'Annulée',
  CONSUMED: 'Consommée',
  REGULARIZED: 'Régularisée',
};

const LEAVE_COMPLIANCE_LABELS = {
  MISSING_DOCUMENT: 'Pièce justificative manquante',
  EXCESS_ALLOWANCE: 'Dépassement du quota autorisé',
  EXPIRED_ENTITLEMENT: 'Congé expiré ou hors délai',
  INVALID_PAY_TREATMENT: 'Traitement paie incohérent',
  LONG_SICKNESS_FOLLOW_UP: 'Suivi requis pour absence maladie longue',
  RETURN_TO_WORK_VISIT_REQUIRED: 'Visite de reprise obligatoire',
  OVERLAPPING_REQUEST: 'Chevauchement avec une autre demande',
  STAFFING_CONFLICT: 'Conflit de couverture d équipe',
};

const LEAVE_SEVERITY_LABELS = {
  INFO: 'Information',
  WARNING: 'A surveiller',
  CRITICAL: 'Critique',
  DANGER: 'Critique',
};

const LEAVE_POLICY_LABELS = {
  annualAccrual: 'Acquisition annuelle',
  annualEligibility: 'Ouverture du droit',
  annualExpiry: 'Délai de prise',
  circumstanceCap: 'Plafond congé de circonstance',
  maternity: 'Règle maternité',
  sicknessRule: 'Règle maladie',
};

export function getLeaveStatusTone(status) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'danger';
    case 'IN_MANAGER_REVIEW':
    case 'IN_HR_REVIEW':
      return 'warning';
    case 'SUBMITTED':
      return 'info';
    default:
      return 'neutral';
  }
}

export function getSeverityTone(severity) {
  switch (String(severity || '').toUpperCase()) {
    case 'CRITICAL':
    case 'DANGER':
      return 'danger';
    case 'WARNING':
      return 'warning';
    default:
      return 'info';
  }
}

export function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

export function getLeaveStatusLabel(status) {
  return LEAVE_STATUS_LABELS[String(status || '').toUpperCase()] || String(status || '-');
}

export function getLeaveComplianceLabel(type) {
  return LEAVE_COMPLIANCE_LABELS[String(type || '').toUpperCase()] || String(type || '-');
}

export function getLeaveSeverityLabel(severity) {
  return LEAVE_SEVERITY_LABELS[String(severity || '').toUpperCase()] || 'Information';
}

export function getLeavePolicyLabel(key) {
  return LEAVE_POLICY_LABELS[key] || key;
}
