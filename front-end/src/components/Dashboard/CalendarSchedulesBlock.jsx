import React, { useEffect, useMemo, useState } from 'react';
import DashboardCalendar from './DashboardCalendar';
import DashboardSchedules from './DashboardSchedules';

const SCHEDULE_EVENTS = [
  {
    id: 'evt-1',
    date: '2035-06-01',
    category: 'Acquisition des talents',
    title: 'Preselection initiale des candidats',
    location: 'Bureau RH',
    time: '09:30 AM',
    avatars: [
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+1',
  },
  {
    id: 'evt-2',
    date: '2035-06-04',
    category: 'Developpement des employes',
    title: 'Lancement du programme de mentorat',
    location: 'Salle de formation',
    time: '11:00 AM',
    avatars: [
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+2',
  },
  {
    id: 'evt-3',
    date: '2035-06-14',
    category: 'Engagement au travail',
    title: "Revue de l'engagement de l'equipe",
    location: 'Salle de reunion B',
    time: '10:00 AM',
    avatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+4',
  },
  {
    id: 'evt-4',
    date: '2035-06-20',
    category: 'Acquisition des talents',
    title: 'Session de revue des portfolios',
    location: 'Espace design',
    time: '02:00 PM',
    avatars: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+3',
  },
  {
    id: 'evt-5',
    date: '2035-06-21',
    category: 'Acquisition des talents',
    title: "Entretien - Candidat Designer Produit",
    location: 'Salle de reunion C',
    time: '09:00 AM',
    avatars: [
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+3',
  },
  {
    id: 'evt-6',
    date: '2035-06-21',
    category: 'Developpement des employes',
    title: 'Revue de performance mi-annee - Equipe Design',
    location: 'Fiche de revue Notion',
    time: '01:00 PM',
    avatars: [
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+21',
  },
  {
    id: 'evt-7',
    date: '2035-06-21',
    category: 'Engagement au travail',
    title: 'Reunion trimestrielle de revue des politiques',
    location: 'Salle de conference 1A',
    time: '03:00 PM',
    avatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+2',
  },
  {
    id: 'evt-8',
    date: '2035-06-25',
    category: 'Developpement des employes',
    title: "Point d'avancement de carriere",
    location: 'Salle People Ops',
    time: '10:30 AM',
    avatars: [
      'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+6',
  },
  {
    id: 'evt-9',
    date: '2035-06-29',
    category: 'Engagement au travail',
    title: "Synthese mensuelle de l'engagement",
    location: 'Salle de conference 2B',
    time: '04:00 PM',
    avatars: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60',
      'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&q=60',
    ],
    more: '+2',
  },
];

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatDateLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const CalendarSchedulesBlock = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date(2035, 5, 1));
  const [selectedDateKey, setSelectedDateKey] = useState('2035-06-21');

  const monthEvents = useMemo(() => {
    const monthKey = toMonthKey(currentDate);
    return SCHEDULE_EVENTS.filter((event) => event.date.startsWith(monthKey));
  }, [currentDate]);

  const eventDateKeys = useMemo(() => {
    return Array.from(new Set(monthEvents.map((event) => event.date))).sort();
  }, [monthEvents]);

  useEffect(() => {
    if (eventDateKeys.length === 0) {
      const fallback = `${toMonthKey(currentDate)}-01`;
      setSelectedDateKey(fallback);
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
