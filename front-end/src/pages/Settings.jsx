import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Card } from '../components/ui';

const SETTINGS_TABS = [
  { label: 'Apparence', to: '/Settings/Appearance' },
  { label: 'Utilisateurs et permissions', to: '/Settings/Users-Permissions' },
];

function Settings() {
  const location = useLocation();
  const activeTab = SETTINGS_TABS.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Parametres', href: '/Settings' },
          { label: activeTab?.label || 'Apparence' },
        ]}
      />

      <div>
        <h2 className="text-2xl font-semibold text-text">Parametres</h2>
        <p className="text-sm text-muted">Gerez les preferences globales de l'application.</p>
      </div>

      <Card contentClassName="p-2">
        <nav className="flex flex-wrap gap-2">
          {SETTINGS_TABS.map((tab) => (
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

export default Settings;
