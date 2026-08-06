import React from 'react';
import { ChevronRight } from 'lucide-react';
import formatFrenchTypography from '../../utils/frenchTypography';

const Breadcrumbs = ({ items = [], className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.key || `${item.label}_${index}`} className="inline-flex items-center gap-1">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  className="rounded px-1.5 py-0.5 transition hover:bg-secondary hover:text-text"
                >
                  {formatFrenchTypography(item.label)}
                </a>
              ) : (
                <span className={isLast ? 'font-semibold text-text' : 'px-1.5 py-0.5'}>
                  {formatFrenchTypography(item.label)}
                </span>
              )}
              {!isLast ? <ChevronRight size={14} className="text-muted/80" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
