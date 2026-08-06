import React from 'react';
import { Bell } from 'lucide-react';
import Dropdown from './dropdown';

const NotificationButton = ({
  notifications = [],
  count = notifications.filter((item) => !item.read).length,
  onSelect,
  onMarkAllRead,
  className = '',
}) => {
  return (
    <Dropdown
      className={className}
      widthClassName="w-96"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text shadow-sm transition hover:bg-secondary"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-on-primary">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h4 className="text-sm font-semibold text-text">Notifications</h4>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:text-primary/80"
          onClick={onMarkAllRead}
        >
          Tout marquer comme lu
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length ? (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item)}
              className={[
                'w-full border-b border-border/70 px-4 py-3 text-left transition hover:bg-secondary/50',
                item.read ? 'bg-surface' : 'bg-secondary/35',
              ].join(' ')}
            >
              <p className="text-sm font-medium text-text">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-xs text-muted">{item.description}</p>
              ) : null}
              {item.time ? <p className="mt-1 text-[11px] text-muted">{item.time}</p> : null}
            </button>
          ))
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted">
            Aucune notification pour le moment.
          </p>
        )}
      </div>
    </Dropdown>
  );
};

export default NotificationButton;
