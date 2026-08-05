import React from 'react';
import formatFrenchTypography from '../../utils/frenchTypography';

const Input = React.forwardRef(function Input(
  {
    id,
    name,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconClick,
    required = false,
    disabled = false,
    className = '',
    inputClassName = '',
    ...props
  },
  ref,
) {
  const LeftIcon = leftIcon;
  const RightIcon = rightIcon;
  const hasError = Boolean(error);

  return (
    <div className={['w-full', className].join(' ')}>
      {label ? (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
          {formatFrenchTypography(label)}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </label>
      ) : null}

      <div className="relative">
        {LeftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            <LeftIcon size={16} />
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={formatFrenchTypography(placeholder)}
          required={required}
          disabled={disabled}
          aria-invalid={hasError}
          className={[
            'w-full rounded-lg border bg-surface text-text placeholder:text-muted',
            'focus:outline-none focus:ring-2',
            hasError
              ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
              : 'border-border focus:border-primary focus:ring-ring/30',
            LeftIcon ? 'pl-10' : 'pl-3',
            RightIcon ? 'pr-10' : 'pr-3',
            'py-2.5',
            'disabled:cursor-not-allowed disabled:bg-background disabled:text-muted',
            inputClassName,
          ].join(' ')}
          {...props}
        />

        {RightIcon ? (
          onRightIconClick ? (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute inset-y-0 right-3 flex items-center text-muted transition hover:text-text"
              tabIndex={-1}
              aria-label="Action du champ"
            >
              <RightIcon size={16} />
            </button>
          ) : (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
              <RightIcon size={16} />
            </span>
          )
        ) : null}
      </div>

      {hasError ? (
        <p className="mt-1 text-xs text-rose-600">{formatFrenchTypography(error)}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{formatFrenchTypography(hint)}</p>
      ) : null}
    </div>
  );
});

export default Input;
