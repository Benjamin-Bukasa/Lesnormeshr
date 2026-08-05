import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Card } from '../components/ui';

const tabs = [
  { to: '/Recruitment/Planification', label: 'Planification' },
  { to: '/Recruitment/Publication', label: 'Publication' },
  { to: '/Recruitment/Selection-Entretiens', label: 'Selection & entretiens' },
  { to: '/Recruitment/Onboarding', label: 'Integration' },
];

function Recruitment() {
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => location.pathname.toLowerCase().startsWith(tab.to.toLowerCase()))?.label
    || 'Planification';

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Recrutement', href: '/Recruitment' },
          { label: activeTab },
        ]}
      />

      <div>
        <h2 className="text-2xl font-semibold text-text">Recrutement</h2>
        <p className="text-sm text-muted">
          Gere les etapes du recrutement de la planification a l&apos;onboarding.
        </p>
      </div>

      <Card contentClassName="p-2">
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) => [
                'rounded-md px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'bg-background text-text hover:bg-secondary',
              ].join(' ')}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </Card>

      <Outlet />
    </div>
  );
}

export default Recruitment;
