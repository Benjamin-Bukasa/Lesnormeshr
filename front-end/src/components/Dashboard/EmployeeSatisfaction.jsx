import React, { useEffect, useState } from 'react';
import { EllipsisVertical, Star } from 'lucide-react';
import { Button } from '../ui';

const Gauge = ({ value }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = 90;
  const cy = 84;
  const r = 58;
  const angle = Math.PI * (1 - clamped / 100);
  const needleX = cx + Math.cos(angle) * (r - 18);
  const needleY = cy - Math.sin(angle) * (r - 18);

  return (
    <svg viewBox="0 0 180 100" className="h-[90px] w-[160px]">
      <defs>
        <linearGradient id="gaugePrimary" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--color-primary) / 0.9)" />
          <stop offset="100%" stopColor="hsl(var(--color-primary) / 0.35)" />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="hsl(var(--color-secondary) / 0.55)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="url(#gaugePrimary)"
        strokeWidth="12"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${clamped} 100`}
        style={{ transition: 'stroke-dasharray 900ms ease' }}
      />
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="hsl(var(--color-text) / 0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ transition: 'x2 900ms ease, y2 900ms ease' }}
      />
      <circle cx={cx} cy={cy} r="11" fill="hsl(var(--color-text) / 0.9)" />
    </svg>
  );
};

const RatingStars = ({ score }) => {
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < full;
        const half = !filled && hasHalf && index === full;
        return (
          <Star
            key={`star_${index}`}
            size={12}
            className={filled || half ? 'text-accent' : 'text-text-secondary/35'}
            fill={filled || half ? 'currentColor' : 'none'}
          />
        );
      })}
    </span>
  );
};

const EmployeeSatisfaction = ({ data = {} }) => {
  const [gaugeValue, setGaugeValue] = useState(0);
  const breakdown = data.breakdown || [];

  useEffect(() => {
    const timer = setTimeout(() => setGaugeValue(Number(data.percent || 0)), 30);
    return () => clearTimeout(timer);
  }, [data.percent]);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Satisfaction des employes</h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0" aria-label="Plus d'options">
          <EllipsisVertical size={14} />
        </Button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-3xl font-semibold leading-none text-text-primary">{data.percent ?? 0}%</p>
          <p className="text-sm text-text-secondary">Employes ayant repondu</p>
          <div className="mt-1 flex items-center gap-1.5">
            <RatingStars score={Number(data.score || 0)} />
            <span className="text-sm font-semibold text-text-primary">{Number(data.score || 0).toFixed(1)}/5</span>
          </div>
        </div>
        <Gauge value={gaugeValue} />
      </div>

      <p className="mt-1.5 rounded-md bg-secondary px-2 py-1 text-[13px] text-text-secondary">
        {data.responseCount
          ? `${data.responseCount} evaluation${data.responseCount === 1 ? '' : 's'} notee${data.responseCount === 1 ? '' : 's'}`
          : 'Aucune evaluation notee en base.'}
        {data.trend ? <span className="font-semibold text-primary">{` (${data.trend})`}</span> : null}
      </p>

      <div className="mt-3 space-y-2.5">
        {breakdown.length === 0 ? (
          <p className="text-sm text-text-secondary">Les retours notes apparaitront ici.</p>
        ) : breakdown.map((item, index) => (
          <article
            key={item.id}
            className="space-y-0.5"
            style={{
              opacity: gaugeValue > 0 ? 1 : 0,
              transform: gaugeValue > 0 ? 'translateY(0px)' : 'translateY(8px)',
              transition: 'opacity 360ms ease, transform 360ms ease',
              transitionDelay: `${index * 70}ms`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
              <div className="inline-flex items-center gap-1">
                <RatingStars score={Number(item.score || 0)} />
                <span className="text-sm font-semibold text-text-primary">{Number(item.score || 0).toFixed(1)}/5</span>
              </div>
            </div>
            <p className="text-[13px] text-text-secondary">{item.percent}% de satisfaction</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EmployeeSatisfaction;
