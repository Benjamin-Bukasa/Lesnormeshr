import React from 'react';
import { MessageCircle } from 'lucide-react';
import Dropdown from './dropdown';

const MessageButtonDropdown = ({
  messages = [],
  count = messages.filter((item) => !item.read).length,
  onSelect,
  onViewAll,
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
          aria-label="Messages"
        >
          <MessageCircle size={18} />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-on-primary">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </button>
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h4 className="text-sm font-semibold text-text">Messages</h4>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:text-primary/80"
          onClick={onViewAll}
        >
          Voir tout
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {messages.length ? (
          messages.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item)}
              className={[
                'flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition hover:bg-secondary/50',
                item.read ? 'bg-surface' : 'bg-secondary/35',
              ].join(' ')}
            >
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.sender || 'Sender'}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-text">
                  {(item.sender || '?').slice(0, 1).toUpperCase()}
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-text">{item.sender}</span>
                  {item.time ? <span className="shrink-0 text-[11px] text-muted">{item.time}</span> : null}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs text-muted">
                  {item.preview}
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted">
            Aucun message pour le moment.
          </p>
        )}
      </div>
    </Dropdown>
  );
};

export default MessageButtonDropdown;
