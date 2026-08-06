import React from 'react';
import { formatFrenchNode } from '../../utils/frenchTypography';

const VARIANT_CLASSES = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 focus-visible:ring-ring',
  secondary: 'bg-secondary text-text hover:bg-secondary/80 focus-visible:ring-ring',
  ghost: 'bg-transparent text-text hover:bg-secondary focus-visible:ring-ring',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

const Button = ({
  children,
  isPrimary,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) => {
  const normalizedVariant = typeof isPrimary === 'boolean'
    ? (isPrimary ? 'primary' : 'secondary')
    : variant;

  const variantClass = VARIANT_CLASSES[normalizedVariant] || VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClass,
        sizeClass,
        className,
      ].join(' ')}
      {...props}
    >
      {formatFrenchNode(children)}
    </button>
  );
};

export default Button;
