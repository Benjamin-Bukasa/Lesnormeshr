import React from 'react';
import { Card } from '../components/ui';

function PayrollDashboard() {
  return (
    <Card
      title="Tableau de bord paie"
      subtitle="Vue d'ensemble des operations de paie."
    >
      <p className="text-sm text-muted">
        Cette section affichera les indicateurs cles du cycle de paie.
      </p>
    </Card>
  );
}

export default PayrollDashboard;
