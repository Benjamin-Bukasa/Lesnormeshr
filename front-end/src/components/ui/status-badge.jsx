import React from 'react';
import formatFrenchTypography from '../../utils/frenchTypography';

const STATUS_TO_TONE = {
  actif: 'success',
  active: 'success',
  approved: 'success',
  approuve: 'success',
  completed: 'success',
  complete: 'success',
  paye: 'success',
  paid: 'success',
  valide: 'success',
  enattente: 'warning',
  pending: 'warning',
  attente: 'warning',
  encours: 'info',
  inprogress: 'info',
  processing: 'info',
  draft: 'neutral',
  brouillon: 'neutral',
  inactive: 'neutral',
  inactif: 'neutral',
  suspended: 'warning',
  suspendu: 'warning',
  rejected: 'danger',
  refuse: 'danger',
  refused: 'danger',
  cancelled: 'danger',
  annule: 'danger',
  impaye: 'danger',
  unpaid: 'danger',
  overdue: 'danger',
  retard: 'danger',
};

const TONE_STYLES = {
  subtle: {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    danger: 'bg-rose-100 text-rose-800 border border-rose-200',
    neutral: 'bg-secondary text-text border border-border',
  },
  solid: {
    success: 'bg-emerald-600 text-white border border-emerald-600',
    warning: 'bg-amber-500 text-white border border-amber-500',
    info: 'bg-blue-600 text-white border border-blue-600',
    danger: 'bg-rose-600 text-white border border-rose-600',
    neutral: 'bg-text text-background border border-text',
  },
  outline: {
    success: 'bg-transparent text-emerald-700 border border-emerald-300',
    warning: 'bg-transparent text-amber-700 border border-amber-300',
    info: 'bg-transparent text-blue-700 border border-blue-300',
    danger: 'bg-transparent text-rose-700 border border-rose-300',
    neutral: 'bg-transparent text-text border border-border',
  },
};

const SIZE_STYLES = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '');
}

function toTone(status, tone) {
  if (tone) {
    return tone;
  }

  const normalized = normalizeStatus(status);
  return STATUS_TO_TONE[normalized] || 'neutral';
}

const StatusBadge = ({
  status,
  label,
  tone,
  variant = 'subtle',
  size = 'md',
  showDot = true,
  rounded = true,
  className = '',
}) => {
  const resolvedTone = toTone(status, tone);
  const resolvedVariant = TONE_STYLES[variant] ? variant : 'subtle';
  const variantStyles = TONE_STYLES[resolvedVariant][resolvedTone] || TONE_STYLES.subtle.neutral;
  const sizeStyles = SIZE_STYLES[size] || SIZE_STYLES.md;
  const text = label || status || 'N/A';

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 font-medium',
        rounded ? 'rounded-full' : 'rounded-md',
        variantStyles,
        sizeStyles,
        className,
      ].join(' ')}
    >
      {showDot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
      <span>{formatFrenchTypography(text)}</span>
    </span>
  );
};

export default StatusBadge;
