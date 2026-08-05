import React, { useEffect, useState } from 'react';
import { Card, DataTable, StatusBadge } from '../components/ui';
import { getLeaveComplianceAlerts, getLeavePolicySnapshot } from '../services/leaveApi';
import {
  formatDate,
  getLeaveComplianceLabel,
  getLeavePolicyLabel,
  getLeaveSeverityLabel,
  getSeverityTone,
} from './leaveHelpers';

function LeaveCompliance() {
  const [alerts, setAlerts] = useState([]);
  const [policySnapshot, setPolicySnapshot] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([getLeaveComplianceAlerts(), getLeavePolicySnapshot()]).then(([alertData, policyData]) => {
      if (!active) return;
      setAlerts(alertData);
      setPolicySnapshot(policyData);
    });

    return () => {
      active = false;
    };
  }, []);

  const columns = [
    {
      header: 'Alerte',
      accessor: 'title',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.title}</p>
          <p className="text-xs text-muted">{getLeaveComplianceLabel(row.type)}</p>
        </div>
      ),
    },
    { header: 'Employé', accessor: 'employee' },
    { header: 'Référence', accessor: 'requestReference' },
    { header: 'Détection', accessor: 'detectedAt', render: (row) => formatDate(row.detectedAt) },
    {
      header: 'Niveau',
      accessor: 'severity',
      render: (row) => (
        <StatusBadge
          status={row.severity}
          label={getLeaveSeverityLabel(row.severity)}
          tone={getSeverityTone(row.severity)}
          showDot={false}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        title="Conformité et audit RH"
        description="Cette vue rassemble les cas qui doivent être corrigés avant clôture ou transmission en paie."
        columns={columns}
        data={alerts}
        emptyMessage="Aucune alerte de conformité."
      />

      <Card
        title="Règles métier actuellement suivies"
        subtitle="Ce rappel permet à RH de relier la décision opérationnelle aux règles de politique interne et de conformité."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(policySnapshot || {}).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{getLeavePolicyLabel(key)}</p>
              <p className="mt-2 text-sm text-text">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LeaveCompliance;
