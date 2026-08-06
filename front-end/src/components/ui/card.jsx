import React from 'react';
import { formatFrenchNode, formatFrenchTypography } from '../../utils/frenchTypography';

const Card = ({
  title,
  subtitle,
  action,
  children,
  footer,
  className = '',
  contentClassName = 'p-5',
  bordered = true,
}) => {
  return (
    <article
      className={[
        'rounded-xl bg-surface shadow-sm',
        bordered ? 'border border-border' : '',
        className,
      ].join(' ')}
    >
      {(title || subtitle || action) ? (
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            {title ? <h3 className="text-base font-semibold text-text">{formatFrenchTypography(title)}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted">{formatFrenchTypography(subtitle)}</p> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </header>
      ) : null}

      <section className={contentClassName}>{formatFrenchNode(children)}</section>

      {footer ? <footer className="border-t border-border p-5">{formatFrenchNode(footer)}</footer> : null}
    </article>
  );
};

export default Card;
