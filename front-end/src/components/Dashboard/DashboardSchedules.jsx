import React, { useMemo } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import DropdownAction from '../ui/dropdownAction';

const formatDateLabel = (isoDate) => {
  if (!isoDate) return 'Aucune date';
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const DashboardSchedules = ({
  selectedDateKey,
  onSelectDateKey,
  dateOptions = [],
  schedules = [],
}) => {
  const selectedDateLabel = useMemo(() => {
    const match = dateOptions.find((item) => item.id === selectedDateKey);
    return match?.label || formatDateLabel(selectedDateKey);
  }, [dateOptions, selectedDateKey]);

  const dateItems = dateOptions.map((item) => ({
    id: item.id,
    label: item.label,
    onClick: () => onSelectDateKey(item.id),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Planning</h3>

        <DropdownAction
          label={(
            <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[13px] font-semibold text-text-primary">
              <CalendarDays size={13} />
              {selectedDateLabel}
              <ChevronDown size={12} />
            </span>
          )}
          items={dateItems}
          buttonClassName="p-0 hover:bg-transparent"
          menuClassName="min-w-[120px]"
          disabled={dateItems.length === 0}
        />
      </div>

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <div className="rounded-lg border border-border bg-background p-3 text-sm text-text-secondary">
            Aucun planning pour cette date.
          </div>
        ) : (
          schedules.map((item) => (
            <article
              key={item.id}
              className="space-y-2 rounded-lg border border-border bg-background p-3"
            >
              <p className="text-[13px] font-semibold text-primary">{item.category}</p>
              <h4 className="text-sm font-semibold leading-tight text-text-primary">
                {item.title}
              </h4>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold text-text-primary">
                    {item.location}
                  </span>
                  <span className="text-xs font-medium text-text-secondary">{item.time}</span>
                </div>

                <div className="flex items-center">
                  {(item.avatars || []).map((avatar, index) => (
                    <img
                      key={`${item.id}_${index}`}
                      src={avatar}
                      alt={`Participant ${index + 1}`}
                      className={['h-5 w-5 rounded-full border border-background object-cover', index > 0 ? '-ml-1.5' : ''].join(' ')}
                      loading="lazy"
                    />
                  ))}
                  {item.more ? (
                    <span className="-ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-on-primary">
                      {item.more}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardSchedules;
