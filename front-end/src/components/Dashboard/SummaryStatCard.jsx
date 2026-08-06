import React from 'react';
import { Link } from 'react-router-dom';
import { EllipsisVertical } from 'lucide-react';
import { Button, Card } from '../ui';

const TREND_BADGE_STYLES = {
  up: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  down: 'border-rose-200 bg-rose-100 text-rose-700',
  flat: 'border-amber-200 bg-amber-100 text-amber-700',
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getTrendParts(trend) {
  const raw = String(trend || '').trim();
  if (!raw) {
    return null;
  }

  const valueMatch = raw.match(/[+-]?\d+(?:[.,]\d+)?\s?%?/);
  const valueLabel = valueMatch ? valueMatch[0].replace(/\s+/g, '') : '=';
  const details = valueMatch ? raw.replace(valueMatch[0], '').trim() : raw;
  const normalized = normalizeText(raw);

  let direction = 'flat';
  if (
    valueLabel.startsWith('-')
    || normalized.includes('baisse')
    || normalized.includes('diminution')
    || normalized.includes('recul')
  ) {
    direction = 'down';
  } else if (
    valueLabel.startsWith('+')
    || normalized.includes('augmentation')
    || normalized.includes('hausse')
    || normalized.includes('progression')
  ) {
    direction = 'up';
  } else {
    const numericValue = Number(valueLabel.replace('%', '').replace(',', '.'));
    if (!Number.isNaN(numericValue)) {
      if (numericValue > 0) direction = 'up';
      if (numericValue < 0) direction = 'down';
      if (numericValue === 0) direction = 'flat';
    }
  }

  return {
    valueLabel,
    details,
    direction,
  };
}

const SummaryStatCard = ({
  title,
  value,
  unitLabel,
  trend,
  to = '/',
}) => {
  const trendParts = getTrendParts(trend);

  return (
    <Card contentClassName="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <Link to={to} aria-label={`Voir les details: ${title}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-full p-0"
            >
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-2xl font-semibold text-text-primary">{value}</h3>
          {unitLabel ? (
            <span className="text-sm text-text-secondary">{unitLabel}</span>
          ) : null}
        </div>

        {trendParts ? (
          <div className="flex items-center gap-2">
            <span
              className={[
                'inline-flex rounded-full border px-2 py-0.5 text-[13px] font-semibold',
                TREND_BADGE_STYLES[trendParts.direction],
              ].join(' ')}
            >
              {trendParts.valueLabel}
            </span>
            {trendParts.details ? (
              <p className="text-sm text-text-secondary">{trendParts.details}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default SummaryStatCard;
