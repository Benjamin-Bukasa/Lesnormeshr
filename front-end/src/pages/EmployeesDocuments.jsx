import React from 'react';
import { Card } from '../components/ui';

function EmployeesDocuments() {
  return (
    <Card
      title="Documents"
      subtitle="Gestion documentaire liee aux employes."
    >
      <p className="text-sm text-muted">
        Cette section affichera les documents RH rattaches a chaque employe.
      </p>
    </Card>
  );
}

export default EmployeesDocuments;
