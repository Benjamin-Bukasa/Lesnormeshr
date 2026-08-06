import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs, Card } from '../components/ui';
import useAuthStore from '../stores/authStore';

const baseTabs = [
  { to: '/Leave/Overview', label: 'Vue d ensemble' },
  { to: '/Leave/My-Requests', label: 'Mes demandes' },
  { to: '/Leave/Balances', label: 'Soldes' },
  { to: '/Leave/Calendar', label: 'Calendrier' },
];

const privilegedTabs = [
  { to: '/Leave/Approvals', label: 'Validation' },
  { to: '/Leave/Compliance', label: 'Conformité' },
];

function hasPermission(user, code) {
  return (user?.access?.permissions || []).includes(code);
}

function Leave() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const canApprove = hasPermission(user, 'leave.request.approve')
    || hasPermission(user, 'user.update')
    || ['ADMIN', 'SUPER_ADMIN'].includes(user?.access?.role?.code);

  const tabs = canApprove ? [...baseTabs, ...privilegedTabs] : baseTabs;

  const activeTab =
    tabs.find((tab) => location.pathname.toLowerCase().startsWith(tab.to.toLowerCase()))?.label
    || 'Vue d ensemble';

  return (
    <div className="space-y-4">
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/' },
          { label: 'Congés', href: '/Leave' },
          { label: activeTab },
        ]}
      />

      <div>
        <h2 className="text-2xl font-semibold text-text">Congés et absences</h2>
        <p className="text-sm text-muted">
          Pilote les demandes, les validations, les soldes et les points de conformité RH.
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

export default Leave;
