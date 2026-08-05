import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { formatFrenchNode, formatFrenchTypography } from '../../utils/frenchTypography';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  size = 'md',
  className = '',
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const modalContent = (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(event) => {
        if (!closeOnOverlayClick) {
          return;
        }
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="presentation"
    >
      <div
        className="w-full px-4 sm:px-6"
      >
        <div
        className={[
          'mx-auto w-full overflow-hidden rounded-xl bg-surface shadow-2xl',
          sizeClass,
          className,
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={formatFrenchTypography(title || 'Fenêtre modale')}
      >
        {(title || description || showCloseButton) && (
          <header className="flex items-start justify-between border-b border-border px-6 py-4">
            <div>
              {title ? (
                <h2 className="text-lg font-semibold text-text">{formatFrenchTypography(title)}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-sm text-muted">{formatFrenchTypography(description)}</p>
              ) : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="rounded-md p-2 text-muted transition hover:bg-secondary hover:text-text"
                aria-label="Fermer la fenêtre modale"
              >
                <X size={18} />
              </button>
            ) : null}
          </header>
        )}

        <section className="max-h-[70vh] overflow-y-auto px-6 py-5">{formatFrenchNode(children)}</section>

        {footer ? (
          <footer className="border-t border-border px-6 py-4">{formatFrenchNode(footer)}</footer>
        ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default Modal;
