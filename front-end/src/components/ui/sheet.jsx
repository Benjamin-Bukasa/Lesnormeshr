import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { formatFrenchNode, formatFrenchTypography } from '../../utils/frenchTypography';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

const SIDE_CLASSES = {
  right: 'right-0 top-0 h-full translate-x-0 border-l border-border',
  left: 'left-0 top-0 h-full translate-x-0 border-r border-border',
};

const SHEET_TRANSITION = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  size = 'md',
  side = 'right',
  className = '',
  overlayClassName = '',
  headerClassName = '',
  contentClassName = '',
  footerClassName = '',
}) {
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

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const sideClass = SIDE_CLASSES[side] || SIDE_CLASSES.right;
  const hiddenAxis = side === 'left' ? { x: '-100%' } : { x: '100%' };

  const sheetContent = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={['fixed inset-0 z-[220] bg-black/45 backdrop-blur-sm', overlayClassName].join(' ')}
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
          <motion.div
            initial={hiddenAxis}
            animate={{ x: 0 }}
            exit={hiddenAxis}
            transition={SHEET_TRANSITION}
            className={[
              'absolute flex w-full flex-col bg-surface shadow-2xl',
              sizeClass,
              sideClass,
              className,
            ].join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label={formatFrenchTypography(title || 'Panneau latéral')}
          >
            {(title || description || showCloseButton) ? (
              <header className={['flex items-start justify-between gap-4 border-b border-border px-6 py-5', headerClassName].join(' ')}>
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
                    aria-label="Fermer le panneau"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </header>
            ) : null}

            <section className={['min-h-0 flex-1 overflow-y-auto px-6 py-5', contentClassName].join(' ')}>
              {formatFrenchNode(children)}
            </section>

            {footer ? (
              <footer className={['border-t border-border px-6 py-4', footerClassName].join(' ')}>
                {formatFrenchNode(footer)}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return open ? sheetContent : null;
  }

  return createPortal(sheetContent, document.body);
}

export default Sheet;
