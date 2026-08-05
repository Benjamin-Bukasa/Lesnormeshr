import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Card } from '../components/ui';

const tabs = [
  { to: '/Payroll/Dashboard', label: 'Tableau de bord' },
  { to: '/Payroll/Liste-Paie', label: 'Liste de paie' },
  { to: '/Payroll/Generation-Paie', label: 'Generation de paie' },
];

function Payroll() {
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => location.pathname.toLowerCase().startsWith(tab.to.toLowerCase()))?.label
    || 'Tableau de bord';

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Gestion de paie', href: '/Payroll' },
          { label: activeTab },
        ]}
      />

      <div>
        <h2 className="text-2xl font-semibold text-text">Gestion de paie</h2>
        <p className="text-sm text-muted">
          Suivi des cycles de paie, listes et generation des bulletins.
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

export default Payroll;
