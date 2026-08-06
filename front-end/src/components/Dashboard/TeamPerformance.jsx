import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import DropdownAction from '../ui/dropdownAction';

const PERIOD_OPTIONS = [
  { id: '6m', label: '6 derniers mois' },
  { id: '3m', label: '3 derniers mois' },
  { id: '1m', label: 'Mois dernier' },
];

const TEAM_SERIES = [
  { month: 'Janv', value: 46.2 },
  { month: 'Fevr', value: 53.8 },
  { month: 'Mars', value: 77.4 },
  { month: 'Avr', value: 76.1 },
  { month: 'Mai', value: 95.2 },
  { month: 'Juin', value: 71.3 },
];

const CHART = {
  width: 280,
  height: 110,
  left: 28,
  right: 10,
  top: 6,
  bottom: 18,
};

function toPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const curr = points[index];
    const controlX = (prev.x + curr.x) / 2;
    path += ` Q ${controlX} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  return path;
}

const TeamPerformance = () => {
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0]);
  const [chartProgress, setChartProgress] = useState(0);

  const points = useMemo(() => {
    const chartWidth = CHART.width - CHART.left - CHART.right;
    const chartHeight = CHART.height - CHART.top - CHART.bottom;
    const stepX = chartWidth / (TEAM_SERIES.length - 1);

    return TEAM_SERIES.map((item, index) => ({
      ...item,
      x: CHART.left + stepX * index,
      y: CHART.top + chartHeight - (item.value / 100) * chartHeight,
    }));
  }, []);

  const highlight = points[4];
  const linePath = useMemo(() => toPath(points), [points]);

  useEffect(() => {
    setChartProgress(0);
    const timer = setTimeout(() => setChartProgress(100), 40);
    return () => clearTimeout(timer);
  }, [period.id]);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Performance d'equipe</h3>

        <DropdownAction
          label={(
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold text-text-primary">
              {period.label}
              <ChevronDown size={12} />
            </span>
          )}
          items={PERIOD_OPTIONS.map((option) => ({
            ...option,
            onClick: () => setPeriod(option),
          }))}
          buttonClassName="p-0 hover:bg-transparent"
          menuClassName="min-w-[130px]"
        />
      </div>

      <div className="mt-2">
        <div className="flex items-end gap-2">
          <p className="text-3xl font-semibold leading-none text-text-primary">89.52%</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <TrendingUp size={10} />
            +3.84%
          </span>
          <span className="text-[11px] text-text-secondary">En hausse vs la semaine derniere</span>
        </div>
      </div>

      <div className="mt-2">
        <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} className="h-[150px] w-full">
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = CHART.top + (CHART.height - CHART.top - CHART.bottom) - ((tick / 100) * (CHART.height - CHART.top - CHART.bottom));
            return (
              <g key={tick}>
                <line
                  x1={CHART.left}
                  y1={y}
                  x2={CHART.width - CHART.right}
                  y2={y}
                  stroke="hsl(var(--color-border) / 0.8)"
                  strokeWidth="1"
                />
                <text
                  x={2}
                  y={y + 3}
                  fontSize="10"
                  fill="hsl(var(--color-muted) / 1)"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {highlight ? (
            <line
              x1={highlight.x}
              y1={CHART.top}
              x2={highlight.x}
              y2={CHART.height - CHART.bottom}
              stroke="hsl(var(--color-muted) / 0.7)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ) : null}

          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--color-primary) / 0.9)"
            strokeWidth="2.2"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${chartProgress} 100`}
            style={{ transition: 'stroke-dasharray 900ms ease' }}
          />

          {highlight ? (
            <>
              <circle
                cx={highlight.x}
                cy={highlight.y}
                r="3.5"
                fill="hsl(var(--color-primary) / 1)"
                style={{
                  opacity: chartProgress > 85 ? 1 : 0,
                  transition: 'opacity 260ms ease',
                }}
              />
              <g
                transform={`translate(${highlight.x - 24}, ${Math.max(4, highlight.y - 34)})`}
                style={{
                  opacity: chartProgress > 92 ? 1 : 0,
                  transition: 'opacity 260ms ease',
                }}
              >
                <rect
                  rx="6"
                  ry="6"
                  width="52"
                  height="24"
                  fill="hsl(var(--color-surface) / 1)"
                  stroke="hsl(var(--color-border) / 1)"
                />
                <text x="6" y="10" fontSize="8" fill="hsl(var(--color-muted) / 1)">
                  Mai 2035
                </text>
                <text x="6" y="19" fontSize="9" fontWeight="700" fill="hsl(var(--color-primary) / 1)">
                  95.2%
                </text>
              </g>
            </>
          ) : null}

          {points.map((point) => (
            <text
              key={`${point.month}_tick`}
              x={point.x}
              y={CHART.height - 3}
              textAnchor="middle"
              fontSize="10"
              fill="hsl(var(--color-muted) / 1)"
            >
              {point.month}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
};

export default TeamPerformance;
