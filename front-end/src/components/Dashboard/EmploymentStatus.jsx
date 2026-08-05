import React, { useEffect, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '../ui';

const STATUS_DATA = [
  { id: 'full_time', label: 'Temps plein', percent: 68, employees: 87, color: 'bg-primary' },
  { id: 'part_time', label: 'Temps partiel', percent: 15, employees: 19, color: 'bg-primary/75' },
  { id: 'freelance', label: 'Freelance', percent: 10, employees: 13, color: 'bg-secondary' },
  { id: 'internship', label: 'Stage', percent: 7, employees: 9, color: 'bg-muted/60' },
];

const EmploymentStatus = () => {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 30);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Statut d'emploi</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 rounded-full p-0"
          aria-label="Plus d'options"
        >
          <EllipsisVertical size={14} />
        </Button>
      </div>

      <div className="mt-2.5 flex items-end gap-1">
        <p className="text-3xl font-semibold leading-none text-text-primary">128</p>
        <p className="pb-0.5 text-sm font-medium text-text-secondary">Employés</p>
      </div>

      <div className="mt-2.5 overflow-hidden rounded-md border border-border bg-background">
        <div className="flex h-4 w-full">
          {STATUS_DATA.map((item, index) => (
            <span
              key={item.id}
              style={{
                width: isAnimated ? `${item.percent}%` : '0%',
                transition: 'width 700ms ease',
                transitionDelay: `${index * 90}ms`,
              }}
              className={item.color}
            />
          ))}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[13px] text-text-secondary">
        <span>0%</span>
        <span>100%</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {STATUS_DATA.map((item) => (
          <article key={item.id} className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className={['inline-flex h-2.5 w-2.5 rounded-full', item.color].join(' ')} />
              <h4 className="text-sm font-semibold text-text-primary">{item.label}</h4>
            </div>
            <p className="text-[13px] text-text-secondary">
              <span className="font-semibold">{item.percent}%</span>
              {' '} - {' '}
              {item.employees} Employés
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EmploymentStatus;
