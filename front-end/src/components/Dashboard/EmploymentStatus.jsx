import React, { useEffect, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Button } from '../ui';

const STATUS_COLORS = [
  'bg-primary',
  'bg-primary/75',
  'bg-secondary',
  'bg-muted/60',
  'bg-accent/70',
  'bg-rose-300',
  'bg-slate-300',
];

const EmploymentStatus = ({ data = {} }) => {
  const [isAnimated, setIsAnimated] = useState(false);
  const statusData = (data.data || []).map((item, index) => ({
    ...item,
    color: STATUS_COLORS[index % STATUS_COLORS.length],
  }));

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 30);
    return () => clearTimeout(timer);
  }, [statusData.length]);

  return (
    <section className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Statut des employes</h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0" aria-label="Plus d'options">
          <EllipsisVertical size={14} />
        </Button>
      </div>

      <div className="mt-2.5 flex items-end gap-1">
        <p className="text-3xl font-semibold leading-none text-text-primary">{data.total ?? 0}</p>
        <p className="pb-0.5 text-sm font-medium text-text-secondary">Employes</p>
      </div>

      {statusData.length === 0 ? (
        <p className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-text-secondary">
          Aucun statut employe en base.
        </p>
      ) : (
        <>
          <div className="mt-2.5 overflow-hidden rounded-md border border-border bg-background">
            <div className="flex h-4 w-full">
              {statusData.map((item, index) => (
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
            {statusData.map((item) => (
              <article key={item.id} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={['inline-flex h-2.5 w-2.5 rounded-full', item.color].join(' ')} />
                  <h4 className="text-sm font-semibold text-text-primary">{item.label}</h4>
                </div>
                <p className="text-[13px] text-text-secondary">
                  <span className="font-semibold">{item.percent}%</span>
                  {' - '}
                  {item.employees} Employes
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default EmploymentStatus;
