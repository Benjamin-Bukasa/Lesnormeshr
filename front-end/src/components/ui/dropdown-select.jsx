import React, { useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import Dropdown from './dropdown';
import formatFrenchTypography from '../../utils/frenchTypography';

function DropdownSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selectionner',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  renderOptionLabel,
  helper,
}) {
  const normalizedValue = value === undefined || value === null ? '' : String(value);

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === normalizedValue) || null,
    [normalizedValue, options],
  );

  const selectedLabel = selectedOption
    ? (renderOptionLabel ? renderOptionLabel(selectedOption) : formatFrenchTypography(selectedOption.label))
    : formatFrenchTypography(placeholder);

  return (
    <div className={['w-full', className].join(' ')}>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
          {formatFrenchTypography(label)}
        </label>
      ) : null}

      <Dropdown
        align="left"
        className="block w-full"
        widthClassName="w-full"
        contentClassName={menuClassName}
        trigger={({ toggle, open }) => (
          <button
            id={id}
            type="button"
            onClick={toggle}
            disabled={disabled}
            className={[
              'flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm text-text outline-none transition',
              'focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-background disabled:text-muted disabled:opacity-70',
              open ? 'border-primary' : 'hover:border-primary/50',
              buttonClassName,
            ].join(' ')}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={selectedOption ? 'text-text' : 'text-muted'}>
              {selectedLabel}
            </span>
            <ChevronDown size={16} className="shrink-0 text-muted" />
          </button>
        )}
      >
        <div className="max-h-72 overflow-y-auto py-1" role="listbox" aria-labelledby={id}>
          {options.length ? (
            options.map((option) => {
              const optionValue = String(option.value);
              const active = optionValue === normalizedValue;

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => onChange?.(option.value, option)}
                  className={[
                    'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-text hover:bg-secondary',
                  ].join(' ')}
                  role="option"
                  aria-selected={active}
                >
                  <span>
                    {renderOptionLabel ? renderOptionLabel(option) : formatFrenchTypography(option.label)}
                  </span>
                  {active ? <Check size={16} className="shrink-0" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-muted">{formatFrenchTypography(placeholder)}</div>
          )}
        </div>
      </Dropdown>

      {helper ? (
        <p className="mt-1 text-xs text-muted">{formatFrenchTypography(helper)}</p>
      ) : null}
    </div>
  );
}

export default DropdownSelect;
