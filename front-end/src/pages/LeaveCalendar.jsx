import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Card, DropdownSelect, StatusBadge } from '../components/ui';
import { getLeaveCalendarEvents, getLeaveFilterOptions } from '../services/leaveApi';
import { formatDate, getLeaveStatusLabel, getLeaveStatusTone } from './leaveHelpers';

function LeaveCalendar() {
  const [events, setEvents] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    let active = true;

    Promise.all([getLeaveCalendarEvents(), getLeaveFilterOptions()]).then(([eventData, options]) => {
      if (!active) return;
      setEvents(eventData);
      setLeaveTypes(options.leaveTypes);
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = useMemo(
    () => events.filter((item) => selectedType === 'all' || item.leaveTypeCode === selectedType),
    [events, selectedType],
  );

  return (
    <div className="space-y-4">
      <Card
        title="Calendrier des absences"
        subtitle="Visualise la présence, les chevauchements et les pics d absence dans l équipe."
        action={(
          <div className="w-56">
            <DropdownSelect
              value={selectedType}
              onChange={setSelectedType}
              options={[{ value: 'all', label: 'Tous les types' }, ...leaveTypes]}
            />
          </div>
        )}
      >
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background/70 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <CalendarRange size={18} />
                </span>
                <div>
                  <p className="font-medium text-text">{event.employee}</p>
                  <p className="text-sm text-muted">{event.team} • {event.leaveType}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted">{formatDate(event.date)}</span>
                <StatusBadge
                  status={event.status}
                  label={getLeaveStatusLabel(event.status)}
                  tone={getLeaveStatusTone(event.status)}
                  showDot={false}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LeaveCalendar;
