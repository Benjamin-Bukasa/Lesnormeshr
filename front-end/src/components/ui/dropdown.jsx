import React, { cloneElement, useEffect, useMemo, useRef, useState } from 'react';

const ALIGN_CLASSES = {
  left: 'left-0',
  right: 'right-0',
};

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  widthClassName = 'w-72',
  className = '',
  contentClassName = '',
  closeOnClickInside = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const triggerNode = useMemo(() => {
    if (typeof trigger === 'function') {
      return trigger({
        open,
        setOpen,
        toggle: () => setOpen((prev) => !prev),
      });
    }

    if (React.isValidElement(trigger)) {
      const nextProps = {
        'aria-expanded': open,
        'aria-haspopup': 'menu',
      };

      nextProps.onClick = (event) => {
        trigger.props.onClick?.(event);
        setOpen((prev) => !prev);
      };

      return cloneElement(trigger, nextProps);
    }

    return (
      <button
        type="button"
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-secondary"
        onClick={() => setOpen((prev) => !prev)}
      >
        Ouvrir
      </button>
    );
  }, [open, trigger]);

  const alignClass = ALIGN_CLASSES[align] || ALIGN_CLASSES.right;

  return (
    <div ref={rootRef} className={['relative inline-block', className].join(' ')}>
      {triggerNode}
      {open ? (
        <div
          className={[
            'absolute z-40 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl',
            widthClassName,
            alignClass,
            contentClassName,
          ].join(' ')}
          role="menu"
          onClick={() => {
            if (closeOnClickInside) {
              setOpen(false);
            }
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export const DropdownItem = ({
  icon: Icon,
  label,
  description,
  onClick,
  className = '',
  danger = false,
}) => {
  return (
    <button
      type="button"
      className={[
        'flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition',
        danger
          ? 'text-rose-600 hover:bg-rose-500/10'
          : 'text-text hover:bg-secondary',
        className,
      ].join(' ')}
      onClick={onClick}
      role="menuitem"
    >
      {Icon ? <Icon size={16} className="mt-0.5 shrink-0" /> : null}
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        ) : null}
      </span>
    </button>
  );
};

export default Dropdown;
