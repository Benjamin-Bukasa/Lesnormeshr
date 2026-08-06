import React from 'react';
import { Card } from '../components/ui';

function PayrollGeneration() {
  return (
    <Card
      title="Generation de paie"
      subtitle="Preparation et lancement du calcul de paie."
    >
      <p className="text-sm text-muted">
        Cette section affichera les actions de generation et de validation de paie.
      </p>
    </Card>
  );
}

export default PayrollGeneration;
