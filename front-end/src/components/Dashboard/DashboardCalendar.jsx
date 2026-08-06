import React, { useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import DropdownAction from '../ui/dropdownAction';

const WEEK_DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_NAMES = [
  'Janvier',
  'Fevrier',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Aout',
  'Septembre',
  'Octobre',
  'Novembre',
  'Decembre',
];

const getDateKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const buildCalendarDays = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = firstDayIndex - 1; i >= 0; i -= 1) {
    const day = daysInPreviousMonth - i;
    const cellDate = new Date(year, month - 1, day);
    cells.push({
      day,
      date: cellDate,
      dateKey: getDateKey(cellDate),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInCurrentMonth; day += 1) {
    const cellDate = new Date(year, month, day);
    cells.push({
      day,
      date: cellDate,
      dateKey: getDateKey(cellDate),
      isCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  const trailingDays = remainder === 0 ? 0 : 7 - remainder;
  for (let day = 1; day <= trailingDays; day += 1) {
    const cellDate = new Date(year, month + 1, day);
    cells.push({
      day,
      date: cellDate,
      dateKey: getDateKey(cellDate),
      isCurrentMonth: false,
    });
  }

  return cells;
};

const DashboardCalendar = ({
  currentDate,
  onChangeCurrentDate,
  selectedDateKey,
  onSelectDateKey,
  eventDateKeys = [],
}) => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const days = useMemo(() => buildCalendarDays(currentDate), [currentDate]);
  const eventSet = useMemo(() => new Set(eventDateKeys), [eventDateKeys]);

  const monthItems = MONTH_NAMES.map((name, index) => ({
    id: `month_${index}`,
    label: name,
    onClick: () => onChangeCurrentDate(new Date(year, index, 1)),
  }));

  const yearItems = Array.from({ length: 16 }, (_, index) => {
    const value = 2028 + index;
    return {
      id: `year_${value}`,
      label: String(value),
      onClick: () => onChangeCurrentDate(new Date(value, month, 1)),
    };
  });

  const navigateMonth = (offset) => {
    onChangeCurrentDate(new Date(year, month + offset, 1));
  };

  const handleDayClick = (cell) => {
    if (!cell.isCurrentMonth) {
      onChangeCurrentDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
    }
    onSelectDateKey(cell.dateKey);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1">
          <DropdownAction
            label={(
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-text-primary">
                {MONTH_NAMES[month]}
                <ChevronDown size={14} className="text-text-secondary" />
              </span>
            )}
            items={monthItems}
            buttonClassName="px-1 py-0.5 hover:bg-secondary/60"
            menuClassName="min-w-[150px]"
          />

          <DropdownAction
            label={(
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-text-primary">
                {year}
                <ChevronDown size={14} className="text-text-secondary" />
              </span>
            )}
            items={yearItems}
            buttonClassName="px-1 py-0.5 hover:bg-secondary/60"
            menuClassName="min-w-[95px]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-text-primary transition hover:bg-secondary/80"
            aria-label="Mois precedent"
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-text-primary transition hover:bg-secondary/80"
            aria-label="Mois suivant"
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {WEEK_DAYS.map((label) => (
          <div key={label} className="text-center text-[13px] font-medium text-text-secondary">
            {label}
          </div>
        ))}

        {days.map((cell) => {
          const hasEvent = eventSet.has(cell.dateKey);
          const isSelected = selectedDateKey === cell.dateKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              className="flex justify-center"
              onClick={() => handleDayClick(cell)}
            >
              <span
                className={[
                  'inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold transition',
                  cell.isCurrentMonth ? 'text-text-primary' : 'text-text-secondary/45',
                  hasEvent ? 'bg-primary/20 text-primary' : '',
                  isSelected ? 'bg-primary text-on-primary' : '',
                ].join(' ')}
              >
                {cell.day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardCalendar;
