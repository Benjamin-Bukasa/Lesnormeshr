import React, { useEffect, useState } from 'react';
import { Card, DataTable, StatusBadge } from '../components/ui';
import { getLeaveBalances } from '../services/leaveApi';
import { formatUnits } from './leaveHelpers';

function LeaveBalances() {
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    let active = true;

    getLeaveBalances().then((data) => {
      if (!active) return;
      setBalances(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const columns = [
    { header: 'Type de congé', accessor: 'leaveType' },
    { header: 'Année', accessor: 'year' },
    { header: 'Ouverture', accessor: 'opening', render: (row) => formatUnits(row.opening) },
    { header: 'Acquis', accessor: 'earned', render: (row) => formatUnits(row.earned) },
    { header: 'Pris', accessor: 'used', render: (row) => formatUnits(row.used) },
    { header: 'En attente', accessor: 'pending', render: (row) => formatUnits(row.pending) },
    {
      header: 'Disponible',
      accessor: 'available',
      render: (row) => (
        <StatusBadge
          status="Disponible"
          label={formatUnits(row.available)}
          tone={row.available > 0 ? 'success' : 'neutral'}
          showDot={false}
        />
      ),
    },
  ];

  const totals = balances.reduce(
    (accumulator, item) => ({
      earned: accumulator.earned + Number(item.earned || 0),
      used: accumulator.used + Number(item.used || 0),
      pending: accumulator.pending + Number(item.pending || 0),
      available: accumulator.available + Number(item.available || 0),
    }),
    {
      earned: 0,
      used: 0,
      pending: 0,
      available: 0,
    },
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card contentClassName="p-5">
          <p className="text-sm text-muted">Droits acquis</p>
          <p className="mt-1 text-2xl font-semibold text-text">{formatUnits(totals.earned)}</p>
        </Card>
        <Card contentClassName="p-5">
          <p className="text-sm text-muted">Congés pris</p>
          <p className="mt-1 text-2xl font-semibold text-text">{formatUnits(totals.used)}</p>
        </Card>
        <Card contentClassName="p-5">
          <p className="text-sm text-muted">Réservés</p>
          <p className="mt-1 text-2xl font-semibold text-text">{formatUnits(totals.pending)}</p>
        </Card>
        <Card contentClassName="p-5">
          <p className="text-sm text-muted">Disponibles</p>
          <p className="mt-1 text-2xl font-semibold text-text">{formatUnits(totals.available)}</p>
        </Card>
      </section>

      <DataTable
        title="Compte congé"
        description="Le solde distingue les droits acquis, les consommations et les demandes encore en cours de validation."
        columns={columns}
        data={balances}
        emptyMessage="Aucun solde de congé disponible."
      />
    </div>
  );
}

export default LeaveBalances;
