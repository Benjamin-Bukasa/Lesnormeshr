import React, { useEffect, useMemo, useState } from 'react';
import { CheckCheck, ShieldAlert, Undo2, XCircle } from 'lucide-react';
import { Card, DataTable, Input, StatusBadge, useToast } from '../components/ui';
import DropdownAction from '../components/ui/dropdownAction';
import { getLeaveApprovals } from '../services/leaveApi';
import {
  formatDate,
  formatUnits,
  getLeaveStatusLabel,
  getLeaveStatusTone,
  normalizeSearchValue,
} from './leaveHelpers';

function LeaveApprovals() {
  const toast = useToast();
  const [approvals, setApprovals] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    let active = true;

    getLeaveApprovals().then((data) => {
      if (!active) return;
      setApprovals(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const filteredApprovals = useMemo(
    () =>
      approvals.filter((item) => normalizeSearchValue([
        item.reference,
        item.employee,
        item.team,
        item.leaveType,
      ].join(' ')).includes(normalizeSearchValue(searchValue))),
    [approvals, searchValue],
  );

  const columns = [
    {
      header: 'Employé',
      accessor: 'employee',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.employee}</p>
          <p className="text-xs text-muted">{row.team}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'leaveType',
    },
    {
      header: 'Période',
      accessor: 'startDate',
      render: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}`,
    },
    {
      header: 'Durée',
      accessor: 'units',
      render: (row) => formatUnits(row.units),
    },
    {
      header: 'Statut',
      accessor: 'status',
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={getLeaveStatusLabel(row.status)}
          tone={getLeaveStatusTone(row.status)}
          showDot={false}
        />
      ),
    },
  ];

  const updateStatus = (row, nextStatus, successTitle) => {
    setApprovals((current) =>
      current.map((item) =>
        item.id === row.id
          ? { ...item, status: nextStatus }
          : item,
      ),
    );

    toast.success(`${row.reference} a été mis à jour.`, {
      title: successTitle,
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Validation manager et RH"
        subtitle="Traite les demandes en attente et sécurise la conformité avant décision finale."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-sm text-muted">À traiter aujourd hui</p>
            <p className="mt-1 text-2xl font-semibold text-text">{filteredApprovals.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-sm text-muted">Demandes RH sensibles</p>
            <p className="mt-1 text-2xl font-semibold text-text">
              {filteredApprovals.filter((item) => item.status === 'IN_HR_REVIEW').length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <p className="text-sm text-muted">Demandes manager en file</p>
            <p className="mt-1 text-2xl font-semibold text-text">
              {filteredApprovals.filter((item) => item.status === 'IN_MANAGER_REVIEW').length}
            </p>
          </div>
        </div>
      </Card>

      <DataTable
        title="File de validation"
        description="Recherche rapidement les dossiers nécessitant une décision ou un contrôle documentaire."
        columns={columns}
        data={filteredApprovals}
        searchInput={{
          value: searchValue,
          onChange: (value) => setSearchValue(value),
          placeholder: 'Recherche par employé, équipe ou référence',
        }}
        emptyMessage="Aucune demande à valider."
        renderActions={(row) => (
          <DropdownAction
            label="Décider"
            items={[
              {
                id: 'approve',
                label: 'Approuver',
                icon: CheckCheck,
                onClick: () => updateStatus(row, 'APPROVED', 'Demande approuvée'),
              },
              {
                id: 'return',
                label: 'Demander un complément',
                icon: Undo2,
                onClick: () => updateStatus(row, 'SUBMITTED', 'Demande renvoyée'),
              },
              {
                id: 'reject',
                label: 'Rejeter',
                icon: XCircle,
                variant: 'danger',
                onClick: () => updateStatus(row, 'REJECTED', 'Demande rejetée'),
              },
            ]}
          />
        )}
      />

      <Card
        title="Contrôles avant validation RH"
        subtitle="Check-list opérationnelle pour éviter les décisions non conformes."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            'Vérifier le justificatif requis.',
            'Confirmer la couverture opérationnelle de l équipe.',
            'Contrôler le plafond annuel et le solde disponible.',
            'Qualifier correctement le traitement paie.',
          ].map((item) => (
            <div key={item} className="rounded-xl border border-border bg-background/70 p-4">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <ShieldAlert size={18} />
              </div>
              <p className="text-sm text-text">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default LeaveApprovals;
