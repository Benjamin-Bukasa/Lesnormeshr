import React from 'react';
import { Card } from '../components/ui';

function PayrollList() {
  return (
    <Card
      title="Liste de paie"
      subtitle="Consultation des paies par periode et statut."
    >
      <p className="text-sm text-muted">
        Cette section affichera la liste des bulletins et lots de paie.
      </p>
    </Card>
  );
}

export default PayrollList;
