import React from 'react';
import Button from './button';
import Modal from './modal';
import formatFrenchTypography from '../../utils/frenchTypography';

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmation',
  description = 'Voulez-vous confirmer cette action ?',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={formatFrenchTypography(title)}
      closeOnOverlayClick={!loading}
      size="sm"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    >
      <p className="text-sm text-text-secondary">{formatFrenchTypography(description)}</p>
    </Modal>
  );
};

export default ConfirmModal;
