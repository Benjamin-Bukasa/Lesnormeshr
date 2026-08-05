import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import DropdownAction from '../ui/dropdownAction';

const PERIOD_OPTIONS = [
  { id: 'this_month', label: 'Ce mois-ci' },
  { id: 'last_month', label: 'Mois dernier' },
  { id: 'last_3_months', label: '3 derniers mois' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];

const ATTENDANCE_ROWS = [
  { time: '8:00 AM', values: [4, 4, 4, 4, 4] },
  { time: '8:30 AM', values: [3, 3, 4, 4, 3] },
  { time: '9:00 AM', values: [1, 3, 4, 3, 3] },
  { time: '9:30 AM', values: [1, 1, 3, 1, 1] },
  { time: '10:00 AM', values: [0, 1, 1, 1, 0] },
  { time: '10:30 AM', values: [0, 0, 1, 0, 0] },
];

const cellClassByLevel = {
  0: 'bg-background',
  1: 'bg-secondary/60',
  2: 'bg-primary/35',
  3: 'bg-primary/70',
  4: 'bg-primary',
};

const AttendanceReport = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS[0]);
  const [isAnimated, setIsAnimated] = useState(false);

  const periodItems = useMemo(
    () =>
      PERIOD_OPTIONS.map((item) => ({
        ...item,
        onClick: () => setSelectedPeriod(item),
      })),
    [],
  );

  useEffect(() => {
    setIsAnimated(false);
    const timer = setTimeout(() => setIsAnimated(true), 30);
    return () => clearTimeout(timer);
  }, [selectedPeriod.id]);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Rapport de presence</h3>

        <DropdownAction
          label={(
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-semibold text-text-primary">
              {selectedPeriod.label}
              <ChevronDown size={12} />
            </span>
          )}
          items={periodItems}
          buttonClassName="p-0 hover:bg-transparent"
          menuClassName="min-w-[130px]"
        />
      </div>

      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-semibold leading-none text-text-primary">92%</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <TrendingUp size={10} />
            +1.54%
          </span>
        </div>
        <p className="text-xs text-text-secondary">Taux de presence</p>
      </div>

      <div className="mt-3.5 space-y-1.5">
        {ATTENDANCE_ROWS.map((row, rowIndex) => (
          <div key={row.time} className="flex items-center gap-2">
            <span className="w-11 shrink-0 text-[10px] text-text-secondary">{row.time}</span>
            <div className="grid flex-1 grid-cols-5 gap-1">
              {row.values.map((value, index) => (
                <span
                  key={`${row.time}_${index}`}
                  className={[
                    'h-4 rounded-md border border-border/60',
                    cellClassByLevel[value] || cellClassByLevel[0],
                  ].join(' ')}
                  style={{
                    opacity: isAnimated ? 1 : 0.35,
                    transform: isAnimated ? 'scale(1)' : 'scale(0.84)',
                    transition: 'opacity 280ms ease, transform 420ms ease',
                    transitionDelay: `${(rowIndex * 5 + index) * 24}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2.5 pl-[52px]">
        <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-text-secondary">
          {DAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AttendanceReport;
