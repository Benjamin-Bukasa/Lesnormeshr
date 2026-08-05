import React from 'react';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import Dropdown, { DropdownItem } from './dropdown';
import { resolveMediaUrl } from '../../utils/media';

const getInitials = (name) => {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
};

const UserCardDropdown = ({
  user,
  items = [],
  onProfile,
  onSettings,
  onLogout,
  className = '',
}) => {
  const fullName = user?.name || 'Utilisateur';
  const role = user?.role || '';
  const email = user?.email || '';
  const avatarUrl = resolveMediaUrl(user?.avatarUrl);

  return (
    <Dropdown
      className={className}
      widthClassName="w-80"
      closeOnClickInside
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left shadow-sm transition hover:bg-secondary"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-text">
              {getInitials(fullName)}
            </span>
          )}
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-semibold text-text">{fullName}</span>
            <span className="block truncate text-xs text-muted">{role || email}</span>
          </span>
          <ChevronDown
            size={16}
            className={['text-muted transition-transform', open ? 'rotate-180' : ''].join(' ')}
          />
        </button>
      )}
    >
      <div className="border-b border-border p-3">
        <p className="truncate text-sm font-semibold text-text">{fullName}</p>
        {email ? <p className="mt-1 truncate text-xs text-muted">{email}</p> : null}
      </div>

      <div className="p-1">
        <DropdownItem label="Mon profil" icon={User} onClick={onProfile} />
        <DropdownItem label="Parametres" icon={Settings} onClick={onSettings} />
        {items.map((item) => (
          <DropdownItem
            key={item.id || item.label}
            label={item.label}
            description={item.description}
            icon={item.icon}
            onClick={item.onClick}
            danger={Boolean(item.danger)}
          />
        ))}
        <DropdownItem label="Deconnexion" icon={LogOut} onClick={onLogout} danger />
      </div>
    </Dropdown>
  );
};

export default UserCardDropdown;
