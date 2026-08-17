import React, { useEffect, useMemo, useState } from 'react';
import DashboardCalendar from './DashboardCalendar';
import DashboardSchedules from './DashboardSchedules';

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatDateLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const CalendarSchedulesBlock = ({ data = {} }) => {
  const events = data.events || [];
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => new Date().toISOString().slice(0, 10));

  const monthEvents = useMemo(() => {
    const monthKey = toMonthKey(currentDate);
    return events.filter((event) => event.date.startsWith(monthKey));
  }, [currentDate, events]);

  const eventDateKeys = useMemo(() => {
    return Array.from(new Set(monthEvents.map((event) => event.date))).sort();
  }, [monthEvents]);

  useEffect(() => {
    if (eventDateKeys.length === 0) {
      setSelectedDateKey(`${toMonthKey(currentDate)}-01`);
      return;
    }

    if (!eventDateKeys.includes(selectedDateKey)) {
      setSelectedDateKey(eventDateKeys[0]);
    }
  }, [currentDate, eventDateKeys, selectedDateKey]);

  const schedulesForSelectedDate = useMemo(() => {
    return monthEvents.filter((event) => event.date === selectedDateKey);
  }, [monthEvents, selectedDateKey]);

  const dateOptions = useMemo(() => {
    return eventDateKeys.map((dateKey) => ({
      id: dateKey,
      label: formatDateLabel(dateKey),
    }));
  }, [eventDateKeys]);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-3">
      <DashboardCalendar
        currentDate={currentDate}
        onChangeCurrentDate={setCurrentDate}
        selectedDateKey={selectedDateKey}
        onSelectDateKey={setSelectedDateKey}
        eventDateKeys={eventDateKeys}
      />
      <div className="border-t border-border" />
      <DashboardSchedules
        selectedDateKey={selectedDateKey}
        onSelectDateKey={setSelectedDateKey}
        dateOptions={dateOptions}
        schedules={schedulesForSelectedDate}
      />
    </section>
  );
};

export default CalendarSchedulesBlock;
