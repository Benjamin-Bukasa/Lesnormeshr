import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Card } from '../components/ui';

const tabs = [
  { to: '/Employees/Liste-Employes', label: 'Liste employés' },
  { to: '/Employees/Creer-Employe', label: 'Créer employé' },
  { to: '/Employees/Documents', label: 'Documents' },
];

function Employees() {
  const location = useLocation();

  const activeTab =
    tabs.find((tab) => location.pathname.toLowerCase().startsWith(tab.to.toLowerCase()))?.label
    || 'Liste employes';

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Employés', href: '/Employees' },
          { label: activeTab },
        ]}
      />

      <div>
        <h2 className="text-2xl font-semibold text-text">Employés</h2>
        <p className="text-sm text-muted">
          Gere les fiches employes, leur creation et leurs documents.
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

export default Employees;
